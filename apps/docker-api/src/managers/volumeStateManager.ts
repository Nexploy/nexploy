import { docker } from '@/utils/dockerClient';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { VolumeInspectInfo } from 'dockerode';
import byline from 'byline';
import {
    Volume,
    VolumeAction,
    VolumeEvent,
    VolumeStateChanges,
} from '@workspace/typescript-interface/docker/docker.volume';
import {
    DockerStatus,
    DockerStatusEvent,
} from '@workspace/typescript-interface/docker/docker.status';
import { dockerStatusManager } from '@/managers/dockerStatusManager';

class VolumeStateManager extends EventEmitter {
    private volumes: Map<string, Volume> = new Map();
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
        dockerStatusManager.on('status-changed', async (event: DockerStatusEvent) => {
            if (this.polling && event.status === 'connected') {
                logger.info('Docker reconnected, reinitializing volume manager');
                try {
                    logger.info('Sending volumes after Docker reconnection');

                    await this.loadInitialState();
                    await this.startDockerEventsListener();
                    this.reconnectAttempts = 0;
                } catch (err) {
                    logger.error({ err }, 'Failed to reinitialize after Docker reconnection');
                }
            } else if (this.polling && event.status === 'disconnected') {
                logger.warn('Docker disconnected, stopping volume event stream');
                if (this.dockerEventStream) {
                    try {
                        this.dockerEventStream.destroy();
                    } catch (err) {
                        logger.error({ err }, 'Error destroying Docker volume event stream');
                    }
                    this.dockerEventStream = null;
                }
            }
        });
    }

    async start() {
        if (this.polling) {
            logger.warn('Volume state manager already running');
            return;
        }

        this.polling = true;
        logger.info('Starting volume state manager');

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
        logger.info('Stopping volume state manager');

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

        this.volumes.clear();
        this.removeAllListeners();
    }

    private async loadInitialState() {
        if (!dockerStatusManager.isConnected()) {
            logger.warn('Cannot load initial state: Docker is not connected');
            return;
        }

        try {
            const volumesResponse = await docker.df();

            const volumes = volumesResponse.Volumes || [];

            for (const volume of volumes) {
                const state = this.parseVolumeInfo(volume);
                this.volumes.set(state.name, state);
            }

            logger.info({ count: this.volumes.size }, 'Initial volume state loaded');

            const initialState: VolumeEvent = {
                type: 'initial',
                volumes: Array.from(this.volumes.values()),
                timestamp: Date.now(),
            };
            this.emit('initial-state', initialState);
        } catch (err) {
            logger.error({ err }, 'Error loading initial volume state');
            throw err;
        }
    }

    private async startDockerEventsListener() {
        try {
            const stream = await docker.getEvents({
                filters: { type: ['volume'] },
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

            logger.info('Docker volume events listener started');
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
        const volumeName = event.Actor?.Attributes?.name;
        if (!volumeName) return;

        const action = event.Action;
        logger.debug({ volumeName, action }, 'Docker Volume event received');

        const stateChangeEvents: VolumeAction[] = ['create', 'mount', 'unmount', 'destroy'];

        if (stateChangeEvents.includes(action)) {
            await this.updateVolumeState(volumeName, action);
        }
    }

    private async updateVolumeState(volumeName: string, action?: VolumeAction) {
        try {
            if (action === 'destroy') {
                const oldState = this.volumes.get(volumeName);
                if (oldState) {
                    this.volumes.delete(volumeName);
                    const volumeRemovedData: VolumeEvent = {
                        type: 'removed',
                        volumeName: oldState.name,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('volume-removed', volumeRemovedData);
                    logger.debug({ volumeName }, 'Volume destroyed');
                }
                return;
            }

            await this.refreshVolumeState(volumeName);
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.volumes.get(volumeName);
                this.volumes.delete(volumeName);

                if (oldState) {
                    const volumeRemovedData: VolumeEvent = {
                        type: 'removed',
                        volumeName: oldState.name,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('volume-removed', volumeRemovedData);
                }
            } else {
                logger.error({ err, volumeName }, 'Error updating volume state');
            }
        }
    }

    private async refreshVolumeState(volumeName: string) {
        const volume = docker.getVolume(volumeName);
        const info = await volume.inspect();
        const newState = this.parseVolumeInfo(info);

        const oldState = this.volumes.get(newState.name);
        this.volumes.set(newState.name, newState);

        if (!oldState) {
            const volumeAdded: VolumeEvent = {
                type: 'added',
                volume: newState,
                timestamp: Date.now(),
            };
            this.emit('volume-added', volumeAdded);
        } else if (this.hasStateChanged(oldState, newState)) {
            const volumeUpdated: VolumeEvent = {
                type: 'updated',
                oldState,
                volume: newState,
                timestamp: Date.now(),
            };
            this.emit('volume-updated', volumeUpdated);
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

        logger.info({ interval: this.POLL_INTERVAL_MS }, 'Fallback Volumes polling started');
    }

    private async fullStateSync() {
        try {
            const volumesResponse = await docker.df();
            const volumes = volumesResponse.Volumes || [];

            for (const volume of volumes) {
                const newState = this.parseVolumeInfo(volume);
                const oldState = this.volumes.get(newState.name);

                if (!oldState) return;

                if (this.hasStateChanged(oldState, newState)) {
                    this.volumes.set(newState.name, newState);

                    const stateChangeDate: VolumeEvent = {
                        type: 'state-change',
                        volumeName: newState.name,
                        volume: newState,
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

    private parseVolumeInfo(volume: VolumeInspectInfo): Volume {
        return {
            name: volume.Name,
            driver: volume.Driver,
            mountpoint: volume.Mountpoint,
            createdAt: Date.now(),
            labels: volume.Labels || {},
            scope: volume.Scope || 'local',
            options: volume.Options || {},
            usageData: volume.UsageData,
            timestamp: Date.now(),
        };
    }

    private hasStateChanged(oldState: Volume, newState: Volume): boolean {
        return (
            JSON.stringify(oldState.labels) !== JSON.stringify(newState.labels) ||
            JSON.stringify(oldState.options) !== JSON.stringify(newState.options) ||
            JSON.stringify(oldState.usageData) !== JSON.stringify(newState.usageData)
        );
    }

    private getStateChanges(oldState: Volume, newState: Volume) {
        const changes: VolumeStateChanges = {};

        if (JSON.stringify(oldState.labels) !== JSON.stringify(newState.labels))
            changes.labels = { from: oldState.labels, to: newState.labels };
        if (JSON.stringify(oldState.options) !== JSON.stringify(newState.options))
            changes.options = { from: oldState.options, to: newState.options };
        if (JSON.stringify(oldState.usageData) !== JSON.stringify(newState.usageData))
            changes.usageData = { from: oldState.usageData, to: newState.usageData };

        return changes;
    }

    getAllVolumes(): Volume[] {
        return Array.from(this.volumes.values());
    }

    getState(volumeName: string): Volume | undefined {
        return this.volumes.get(volumeName);
    }

    getStats() {
        return {
            volumeCount: this.volumes.size,
            eventStreamActive: this.dockerEventStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            polling: this.polling,
        };
    }

    async hardRefresh(): Promise<void> {
        logger.info('Starting hard refresh of volume state');

        try {
            const volumesResponse = await docker.df();
            const volumes = volumesResponse.Volumes || [];
            const newVolumeMap = new Map<string, Volume>();

            for (const volume of volumes) {
                const state = this.parseVolumeInfo(volume);
                newVolumeMap.set(state.name, state);
            }

            for (const [volumeName, oldState] of this.volumes.entries()) {
                if (!newVolumeMap.has(volumeName)) {
                    const volumeRemovedData: VolumeEvent = {
                        type: 'removed',
                        volumeName: oldState.name,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('volume-removed', volumeRemovedData);
                    logger.debug({ volumeName }, 'Volume detected as removed during hard refresh');
                }
            }

            for (const [volumeName, newState] of newVolumeMap.entries()) {
                const oldState = this.volumes.get(volumeName);

                if (!oldState) {
                    const volumeAdded: VolumeEvent = {
                        type: 'added',
                        volume: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('volume-added', volumeAdded);
                    logger.debug({ volumeName }, 'Volume detected as added during hard refresh');
                } else if (this.hasStateChanged(oldState, newState)) {
                    const volumeUpdated: VolumeEvent = {
                        type: 'updated',
                        oldState,
                        volume: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('volume-updated', volumeUpdated);
                    logger.debug({ volumeName }, 'Volume detected as updated during hard refresh');
                }
            }

            this.volumes = newVolumeMap;

            logger.info({ count: this.volumes.size }, 'Hard refresh completed successfully');
        } catch (err) {
            logger.error({ err }, 'Error during hard refresh of volume state');
            throw err;
        }
    }
}

export const volumeStateManager = new VolumeStateManager();
