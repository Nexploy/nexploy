import { docker } from '@/utils/dockerClient';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { ImageInfo, ImageInspectInfo } from 'dockerode';
import byline from 'byline';
import {
    Image,
    ImageAction,
    ImageEvent,
    ImageStateChanges,
} from '@workspace/typescript-interface/docker.image';
import { DockerStatus } from '@workspace/typescript-interface/docker.status';
import { dockerStatusManager } from '@/services/dockerStatusManager';

class ImageStateManager extends EventEmitter {
    private images: Map<string, Image> = new Map();
    private polling: boolean = false;
    private pollInterval: NodeJS.Timeout | null = null;
    private readonly POLL_INTERVAL_MS = 10000;
    private dockerEventStream: any = null;
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 5;

    constructor() {
        super();
        this.setMaxListeners(100);
        this.setupDockerStatusListeners();
    }

    private setupDockerStatusListeners() {
        dockerStatusManager.on('docker-reconnected', async () => {
            if (this.polling) {
                logger.info('Docker reconnected, reinitializing container manager');
                try {
                    logger.info('Sending images after Docker reconnection');

                    await this.loadInitialState();
                    await this.startDockerEventsListener();
                    this.reconnectAttempts = 0;
                } catch (err) {
                    logger.error({ err }, 'Failed to reinitialize after Docker reconnection');
                }
            }
        });

        dockerStatusManager.on('docker-disconnected', () => {
            logger.warn('Docker disconnected, stopping event stream');
            if (this.dockerEventStream) {
                try {
                    this.dockerEventStream.destroy();
                } catch (err) {
                    logger.error({ err }, 'Error destroying Docker event stream');
                }
                this.dockerEventStream = null;
            }
        });
    }

    async start() {
        if (this.polling) {
            logger.warn('Image state manager already running');
            return;
        }

        this.polling = true;
        logger.info('Starting image state manager');

        const status = dockerStatusManager.getStatus();

        if (status === 'connecting') {
            await new Promise<void>((resolve) => {
                dockerStatusManager.once(
                    'status-changed',
                    ({ status }: { status: DockerStatus }) => {
                        if (status !== 'connecting') resolve();
                    },
                );
            });
        }

        if (dockerStatusManager.isConnected()) {
            try {
                await this.loadInitialState();
                await this.startDockerEventsListener();
            } catch (err) {
                logger.error({ err }, 'Failed to initialize with Docker, falling back to polling');
            }
        } else {
            logger.warn(`Docker unavailable (status: ${status}) — using polling only`);
        }

        this.startFallbackPolling();
    }

    async stop() {
        this.polling = false;
        logger.info('Stopping image state manager');

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

        if (this.dockerEventStream) {
            try {
                this.dockerEventStream.destroy();
            } catch (err) {
                logger.error({ err }, 'Error destroying Docker event stream');
            }
            this.dockerEventStream = null;
        }

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

            const initialState: ImageEvent = {
                type: 'initial',
                images: Array.from(this.images.values()),
                timestamp: Date.now(),
            };
            this.emit('initial-state', initialState);
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
            return;
        }

        const backoffDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        logger.info(
            { backoffDelay, attempt: this.reconnectAttempts },
            'Reconnecting to Docker events',
        );

        setTimeout(() => {
            if (this.polling && dockerStatusManager.isConnected()) {
                this.startDockerEventsListener();
            } else {
                logger.warn('Skipping event listener reconnection: Docker not connected');
            }
        }, backoffDelay);
    }

    private async handleDockerEvent(event: any) {
        const imageId = event.id;
        if (!imageId) return;

        const action = event.Action;
        logger.debug({ imageId, action }, 'Docker Image event received');

        const stateChangeEvents: ImageAction[] = [
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

    private async updateImageState(imageId: string, action?: ImageAction) {
        const imageIdSplited = imageId.split(':')[1];

        try {
            if (action === 'delete') {
                const oldState = this.images.get(imageIdSplited);
                if (oldState) {
                    this.images.delete(imageIdSplited);
                    const imageRemovedData: ImageEvent = {
                        type: 'removed',
                        imageId: oldState.id,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-removed', imageRemovedData);
                    logger.debug({ imageIdSplited }, 'Image deleted');
                }
                return;
            }

            if (action === 'untag') {
                try {
                    await this.refreshImageState(imageIdSplited);
                } catch (err: any) {
                    if (err.statusCode === 404) {
                        const oldState = this.images.get(imageIdSplited);
                        if (oldState) {
                            this.images.delete(imageIdSplited);
                            const imageRemovedData: ImageEvent = {
                                type: 'removed',
                                imageId: oldState.id,
                                oldState,
                                timestamp: Date.now(),
                            };
                            this.emit('image-removed', imageRemovedData);
                            logger.debug({ imageId }, 'Image removed after untag');
                        }
                    } else {
                        throw err;
                    }
                }
                return;
            }
            await this.refreshImageState(imageId);
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.images.get(imageIdSplited);
                this.images.delete(imageIdSplited);

                if (oldState) {
                    const imageRemovedData: ImageEvent = {
                        type: 'removed',
                        imageId: oldState.id,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-removed', imageRemovedData);
                }
            } else {
                logger.error({ err, imageId: imageIdSplited }, 'Error updating image state');
            }
        }
    }

    private async refreshImageState(imageId: string) {
        const image = docker.getImage(imageId);
        const info = await image.inspect();
        const newState = this.parseImageInfo(info);

        const oldState = this.images.get(newState.id);
        this.images.set(newState.id, newState);

        if (!oldState) {
            const imageAdded: ImageEvent = {
                type: 'added',
                image: newState,
                timestamp: Date.now(),
            };
            this.emit('image-added', imageAdded);
        } else if (this.hasStateChanged(oldState, newState)) {
            const imageUpdated: ImageEvent = {
                type: 'updated',
                oldState,
                image: newState,
                timestamp: Date.now(),
            };
            this.emit('image-updated', imageUpdated);
        }
    }

    private startFallbackPolling() {
        this.pollInterval = setInterval(async () => {
            if (!this.polling) return;

            if (!dockerStatusManager.isConnected()) {
                logger.debug('Skipping poll: Docker not connected');
                return;
            }

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

            for (const image of images) {
                const newState = this.parseImageInfo(image);
                const oldState = this.images.get(newState.id);

                if (!oldState) return;

                if (this.hasStateChanged(oldState, newState)) {
                    this.images.set(newState.id, newState);

                    const stateChangeDate: ImageEvent = {
                        type: 'state-change',
                        imageId: newState.id,
                        image: newState,
                        changes: this.getStateChanges(oldState, newState),
                        timestamp: Date.now(),
                    };
                    this.emit('state-change', stateChangeDate);
                }
            }
        } catch (err) {
            logger.error({ err }, 'Error in full state sync');
        }
    }

    private isImageInspectInfo(image: ImageInfo | ImageInspectInfo): image is ImageInspectInfo {
        return 'Config' in image || 'Architecture' in image;
    }

    private parseImageInfo(image: ImageInfo | ImageInspectInfo): Image {
        const isInspect = this.isImageInspectInfo(image);

        const name = image.RepoTags?.map((tag) => tag.split(':')[0]);
        const tag = image.RepoTags?.map((tag) => tag.split(':')[1]);

        const id = image.Id.split(':')[1];

        return {
            id,
            fullId: image.Id,
            name: name || [],
            tag: tag || [],
            repoTags: image.RepoTags || [],
            repoDigests: image.RepoDigests || [],
            created: isInspect ? new Date(image.Created).getTime() / 1000 : image.Created,
            size: image.Size,
            virtualSize: image.VirtualSize,
            sharedSize: isInspect ? 0 : (image as ImageInfo).SharedSize || 0,
            labels: isInspect ? image.Config?.Labels || {} : (image as ImageInfo).Labels || {},
            containersUsed: (image as ImageInfo).Containers || 0,
            ...(isInspect && {
                parent: image.Parent,
                architecture: image.Architecture,
                os: image.Os,
            }),
            timestamp: Date.now(),
        };
    }

    private hasStateChanged(oldState: Image, newState: Image): boolean {
        return (
            JSON.stringify(oldState.repoTags) !== JSON.stringify(newState.repoTags) ||
            oldState.size !== newState.size ||
            oldState.containersUsed !== newState.containersUsed
        );
    }

    private getStateChanges(oldState: Image, newState: Image) {
        const changes: ImageStateChanges = {};

        if (JSON.stringify(oldState.repoTags) !== JSON.stringify(newState.repoTags))
            changes.repoTags = { from: oldState.repoTags, to: newState.repoTags };
        if (oldState.size !== newState.size)
            changes.size = { from: oldState.size, to: newState.size };
        if (oldState.containersUsed !== newState.containersUsed)
            changes.containers = {
                from: oldState.containersUsed,
                to: newState.containersUsed,
            };

        return changes;
    }

    getAllStates(): Image[] {
        return Array.from(this.images.values());
    }

    getState(imageId: string): Image | undefined {
        return this.images.get(imageId);
    }

    getStats() {
        return {
            imageCount: this.images.size,
            eventStreamActive: this.dockerEventStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            polling: this.polling,
        };
    }

    getByName(fullName: string): Image | undefined {
        for (const image of this.images.values()) {
            if (image.repoTags.includes(fullName)) {
                return image;
            }
        }
        return undefined;
    }

    async hardRefresh(): Promise<void> {
        logger.info('Starting hard refresh of image state');

        try {
            const images = await docker.listImages({ all: true });
            const newImageMap = new Map<string, Image>();

            for (const image of images) {
                const state = this.parseImageInfo(image);
                newImageMap.set(state.id, state);
            }

            for (const [imageId, oldState] of this.images.entries()) {
                if (!newImageMap.has(imageId)) {
                    const imageRemovedData: ImageEvent = {
                        type: 'removed',
                        imageId: oldState.id,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-removed', imageRemovedData);
                    logger.debug({ imageId }, 'Image detected as removed during hard refresh');
                }
            }

            for (const [imageId, newState] of newImageMap.entries()) {
                const oldState = this.images.get(imageId);

                if (!oldState) {
                    const imageAdded: ImageEvent = {
                        type: 'added',
                        image: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-added', imageAdded);
                    logger.debug({ imageId }, 'Image detected as added during hard refresh');
                } else if (this.hasStateChanged(oldState, newState)) {
                    const imageUpdated: ImageEvent = {
                        type: 'updated',
                        oldState,
                        image: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('image-updated', imageUpdated);
                    logger.debug({ imageId }, 'Image detected as updated during hard refresh');
                }
            }

            this.images = newImageMap;

            logger.info({ count: this.images.size }, 'Hard refresh completed successfully');

            const refreshedState: ImageEvent = {
                type: 'initial',
                images: Array.from(this.images.values()),
                timestamp: Date.now(),
            };
            this.emit('initial-state', refreshedState);
        } catch (err) {
            logger.error({ err }, 'Error during hard refresh of image state');
            throw err;
        }
    }
}

export const imageStateManager = new ImageStateManager();
