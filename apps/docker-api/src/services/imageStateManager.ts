import { docker } from '@/utils/dockerClient';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { ImageInfo } from 'dockerode';
import byline from 'byline';
import { DockerImage } from '@workspace/typescript-interface/docker.image';
import { DockerStatus } from '@workspace/typescript-interface/docker.status';

class ImageStateManager extends EventEmitter {
    private images: Map<string, DockerImage> = new Map();
    private polling: boolean = false;
    private pollInterval: NodeJS.Timeout | null = null;
    private readonly POLL_INTERVAL_MS = 10000;
    private dockerEventStream: any = null;
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;
    private dockerHealthCheckInterval: NodeJS.Timeout | null = null;
    private readonly DOCKER_HEALTH_CHECK_MS = 5000;
    private dockerStatus: DockerStatus = 'disconnected';
    private lastDockerCheck: number = 0;

    constructor() {
        super();
        this.setMaxListeners(100);
    }

    private async checkDockerHealth(): Promise<DockerStatus> {
        try {
            await docker.ping();
            return 'connected';
        } catch (err) {
            logger.error('Docker daemon not available');
            return 'error';
        }
    }

    async start() {
        if (this.polling) {
            logger.warn('Image state manager already running');
            return;
        }

        this.polling = true;
        logger.info('Starting image state manager');

        this.dockerStatus = 'connecting';
        this.emit('docker-connecting', { timestamp: Date.now() });

        this.dockerStatus = await this.checkDockerHealth();

        if (this.dockerStatus === 'error' || this.dockerStatus === 'disconnected') {
            logger.warn('Docker daemon not available, starting in polling-only mode');
            this.dockerStatus = 'disconnected';
            this.emit('docker-unavailable', {
                message: 'Docker daemon is not reachable',
                timestamp: Date.now(),
            });
        } else {
            logger.info('Docker daemon is available');
            this.emit('docker-available', {
                message: 'Docker daemon is available',
                timestamp: Date.now(),
            });
        }

        this.startDockerHealthCheck();

        if (this.dockerStatus === 'connected') {
            try {
                await this.loadInitialState();
                await this.startDockerEventsListener();
            } catch (err) {
                logger.error({ err }, 'Failed to initialize with Docker, falling back to polling');
                this.dockerStatus = 'error';
                this.emit('docker-unavailable', {
                    message: 'Failed to initialize Docker connection',
                    error: err,
                    timestamp: Date.now(),
                });
            }
        }

        this.startFallbackPolling();
    }

    private startDockerHealthCheck() {
        this.dockerHealthCheckInterval = setInterval(async () => {
            if (!this.polling) return;

            const now = Date.now();
            this.lastDockerCheck = now;

            const wasAvailable = this.dockerStatus === 'connected';
            const previousStatus = this.dockerStatus;

            if (!wasAvailable && this.dockerStatus !== 'connecting') {
                this.dockerStatus = 'connecting';
                this.emit('docker-connecting', { timestamp: now });
            }

            const newStatus = await this.checkDockerHealth();

            if (this.dockerStatus !== newStatus) {
                this.dockerStatus = newStatus;
            }

            if (!wasAvailable && this.dockerStatus === 'connected') {
                logger.info('Docker daemon became available, reconnecting...');
                this.emit('docker-available', { timestamp: now });

                try {
                    await this.loadInitialState();
                    await this.startDockerEventsListener();
                    this.reconnectAttempts = 0;
                } catch (err) {
                    logger.error({ err }, 'Failed to reconnect to Docker');
                    this.dockerStatus = 'error';
                }
            } else if (wasAvailable && this.dockerStatus !== 'connected') {
                logger.warn('Docker daemon became unavailable');
                this.dockerStatus = this.dockerStatus === 'error' ? 'error' : 'disconnected';
                this.emit('docker-unavailable', {
                    message: 'Docker daemon is no longer reachable',
                    timestamp: now,
                });

                if (this.dockerEventStream) {
                    try {
                        this.dockerEventStream.destroy();
                    } catch (err) {
                        logger.error({ err }, 'Error destroying Docker event stream');
                    }
                    this.dockerEventStream = null;
                }
            } else if (previousStatus === 'connecting' && this.dockerStatus === 'error') {
                this.dockerStatus = 'disconnected';
            }
        }, this.DOCKER_HEALTH_CHECK_MS);

        logger.info({ interval: this.DOCKER_HEALTH_CHECK_MS }, 'Docker health check started');
    }

    async stop() {
        this.polling = false;
        logger.info('Stopping image state manager');

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

        if (this.dockerHealthCheckInterval) {
            clearInterval(this.dockerHealthCheckInterval);
            this.dockerHealthCheckInterval = null;
        }

        if (this.dockerEventStream) {
            try {
                this.dockerEventStream.destroy();
            } catch (err) {
                logger.error({ err }, 'Error destroying Docker event stream');
            }
            this.dockerEventStream = null;
        }

        this.dockerStatus = 'disconnected';
        this.images.clear();
        this.removeAllListeners();
    }

    private async loadInitialState() {
        try {
            const images = await docker.listImages({ all: true });

            for (const image of images) {
                const state = this.parseImageInfo(image);
                this.images.set(state.id, state);
            }

            logger.info({ count: this.images.size }, 'Initial image state loaded');
            this.emit('initial-state', Array.from(this.images.values()));
        } catch (err) {
            logger.error({ err }, 'Error loading initial image state');
            throw err;
        }
    }

    private async startDockerEventsListener() {
        try {
            const stream = await docker.getEvents({
                filters: { type: ['image'] },
            });

            this.dockerEventStream = stream;
            this.reconnectAttempts = 0;

            const lineStream = byline.createStream(stream);

            lineStream.on('data', async (line: Buffer) => {
                const str = line.toString().trim();
                if (!str) return;

                try {
                    const event = JSON.parse(str);
                    await this.handleDockerEvent(event);
                } catch (err) {
                    logger.error({ err, raw: str }, 'Error parsing Docker event');
                }
            });

            lineStream.on('error', (err: Error) => {
                logger.error({ err }, 'Docker events stream error');
                this.handleStreamError();
            });

            lineStream.on('end', () => {
                logger.warn('Docker events stream ended');
                this.handleStreamError();
            });

            logger.info('Docker events listener started');
        } catch (err) {
            logger.error({ err }, 'Error starting Docker events listener');
            await this.handleStreamError();
        }
    }

    private async handleStreamError() {
        if (!this.polling) return;

        this.dockerEventStream = null;
        this.reconnectAttempts++;

        if (this.reconnectAttempts > this.MAX_RECONNECT_ATTEMPTS) {
            logger.error('Max reconnection attempts reached, relying on polling only');
            this.dockerStatus = 'error';
            return;
        }

        const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        logger.info(
            { backoffDelay, attempt: this.reconnectAttempts },
            'Reconnecting to Docker events',
        );

        this.dockerStatus = 'error';

        setTimeout(() => {
            if (this.polling) {
                this.startDockerEventsListener();
            }
        }, backoffDelay);
    }

    private async handleDockerEvent(event: any) {
        const imageId = event.Actor?.ID;
        if (!imageId) return;

        const action = event.Action;
        logger.debug({ imageId, action }, 'Docker event received');

        const stateChangeEvents = [
            'pull',
            'push',
            'tag',
            'untag',
            'delete',
            'import',
            'load',
            'save',
        ];

        if (stateChangeEvents.includes(action)) {
            await this.updateImageState(imageId, action);
        }
    }

    private async updateImageState(imageId: string, action?: string) {
        try {
            if (action === 'delete' || action === 'untag') {
                // Vérifier si l'image existe encore
                try {
                    const image = docker.getImage(imageId);
                    await image.inspect();
                    // L'image existe encore, mettre à jour son état
                    await this.refreshImageState(imageId);
                } catch (err: any) {
                    if (err.statusCode === 404) {
                        // L'image n'existe plus
                        const oldState = this.images.get(imageId);
                        this.images.delete(imageId);

                        if (oldState) {
                            this.emit('image-removed', { id: imageId, oldState });
                            this.emit('state-change', {
                                type: 'removed',
                                image: oldState,
                            });
                        }
                    }
                }
                return;
            }

            await this.refreshImageState(imageId);
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.images.get(imageId);
                this.images.delete(imageId);

                if (oldState) {
                    this.emit('image-removed', { id: imageId, oldState });
                    this.emit('state-change', {
                        type: 'removed',
                        image: oldState,
                    });
                }
            } else {
                logger.error({ err, imageId }, 'Error updating image state');
            }
        }
    }

    private async refreshImageState(imageId: string) {
        const image = docker.getImage(imageId);
        const info = await image.inspect();
        const newState = this.parseImageInspect(info);

        const oldState = this.images.get(imageId);
        this.images.set(imageId, newState);

        if (!oldState) {
            this.emit('image-added', newState);
            this.emit('state-change', {
                type: 'added',
                image: newState,
            });
        } else if (this.hasStateChanged(oldState, newState)) {
            this.emit('image-updated', { oldState, newState });
            this.emit('state-change', {
                type: 'updated',
                image: newState,
                changes: this.getStateChanges(oldState, newState),
            });
        }
    }

    private startFallbackPolling() {
        this.pollInterval = setInterval(async () => {
            if (!this.polling || this.dockerStatus === 'disconnected') return;

            try {
                await this.fullStateSync();
            } catch (err) {
                logger.error({ err }, 'Error in fallback polling');
            }
        }, this.POLL_INTERVAL_MS);

        logger.info({ interval: this.POLL_INTERVAL_MS }, 'Fallback Images polling started');
    }

    private async fullStateSync() {
        try {
            const images = await docker.listImages({ all: true });
            const currentIds = new Set(images.map((i) => i.Id));

            for (const image of images) {
                const newState = this.parseImageInfo(image);
                const oldState = this.images.get(newState.id);

                if (!oldState) {
                    this.images.set(newState.id, newState);
                    this.emit('image-added', newState);
                    this.emit('state-change', {
                        type: 'added',
                        image: newState,
                    });
                } else if (this.hasStateChanged(oldState, newState)) {
                    this.images.set(newState.id, newState);
                    this.emit('image-updated', { oldState, newState });
                    this.emit('state-change', {
                        type: 'updated',
                        image: newState,
                        changes: this.getStateChanges(oldState, newState),
                    });
                }
            }

            for (const [id, state] of this.images) {
                if (!currentIds.has(id)) {
                    this.images.delete(id);
                    this.emit('image-removed', { id, oldState: state });
                    this.emit('state-change', {
                        type: 'removed',
                        image: state,
                    });
                }
            }
        } catch (err) {
            logger.error('Error in full state sync');
            if (this.dockerStatus === 'connected') {
                this.dockerStatus = 'error';
            }
        }
    }

    private parseImageInfo(image: ImageInfo): DockerImage {
        return {
            id: image.Id,
            repoTags: image.RepoTags || [],
            repoDigests: image.RepoDigests || [],
            created: image.Created,
            size: image.Size,
            virtualSize: image.VirtualSize,
            sharedSize: image.SharedSize || 0,
            labels: image.Labels || {},
            containers: image.Containers || 0,
            timestamp: Date.now(),
        };
    }

    private parseImageInspect(info: any): DockerImage {
        return {
            id: info.Id,
            repoTags: info.RepoTags || [],
            repoDigests: info.RepoDigests || [],
            created: new Date(info.Created).getTime() / 1000,
            size: info.Size,
            virtualSize: info.VirtualSize,
            sharedSize: info.SharedSize || 0,
            labels: info.Config?.Labels || {},
            containers: info.Containers || 0,
            parent: info.Parent,
            architecture: info.Architecture,
            os: info.Os,
            timestamp: Date.now(),
        };
    }

    private hasStateChanged(oldState: DockerImage, newState: DockerImage): boolean {
        return (
            JSON.stringify(oldState.repoTags) !== JSON.stringify(newState.repoTags) ||
            oldState.size !== newState.size ||
            oldState.containers !== newState.containers
        );
    }

    private getStateChanges(oldState: DockerImage, newState: DockerImage) {
        const changes: any = {};

        if (JSON.stringify(oldState.repoTags) !== JSON.stringify(newState.repoTags))
            changes.repoTags = { from: oldState.repoTags, to: newState.repoTags };
        if (oldState.size !== newState.size)
            changes.size = { from: oldState.size, to: newState.size };
        if (oldState.containers !== newState.containers)
            changes.containers = {
                from: oldState.containers,
                to: newState.containers,
            };

        return changes;
    }

    getAllStates(): DockerImage[] {
        return Array.from(this.images.values());
    }

    getState(imageId: string): DockerImage | undefined {
        return this.images.get(imageId);
    }

    getDockerStatus(): DockerStatus {
        return this.dockerStatus;
    }

    getLastDockerCheck(): number {
        return this.lastDockerCheck;
    }

    getStats() {
        return {
            dockerAvailable: this.dockerStatus,
            lastDockerCheck: this.lastDockerCheck,
            imageCount: this.images.size,
            eventStreamActive: this.dockerEventStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            polling: this.polling,
        };
    }
}

export const imageStateManager = new ImageStateManager();
