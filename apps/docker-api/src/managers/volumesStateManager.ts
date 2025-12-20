import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import { VolumeInspectInfo } from 'dockerode';
import {
    Volume,
    VolumeAction,
    VolumeEvent,
    VolumeStateChanges,
} from '@workspace/typescript-interface/docker/docker.volume';
import { BaseStateManager } from '@/lib/BaseStateManager';

export class VolumesStateManager extends BaseStateManager {
    private volumes: Map<string, Volume> = new Map();

    constructor(environmentId: string) {
        super({
            managerName: `Volume State Manager [${environmentId}]`,
            environmentId,
            pollIntervalMs: 10000,
            maxReconnectAttempts: 5,
            maxListeners: 100,
        });
    }

    async loadInitialState(): Promise<void> {
        try {
            if (!this.getDockerStatusManager().isConnected()) {
                logger.warn('Cannot load initial state: Docker is not connected');
                return;
            }
        } catch (err) {
            logger.warn('Cannot load initial state: Docker status manager not available');
            return;
        }

        try {
            const volumesResponse = await this.docker.df();
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

    async handleDockerEvent(event: any): Promise<void> {
        const volumeName = event.Actor?.ID;
        if (!volumeName) return;

        const action = event.Action;
        logger.debug({ volumeName, action }, 'Docker Volume event received');

        const stateChangeEvents: VolumeAction[] = ['create', 'mount', 'unmount', 'destroy'];

        if (stateChangeEvents.includes(action)) {
            await this.updateVolumeState(volumeName, action);
        }
    }

    async fullStateSync(): Promise<void> {
        try {
            const volumesResponse = await this.docker.df();
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

    getEventFilters(): Record<string, string[]> {
        return { type: ['volume'] };
    }

    protected onStop(): void {
        this.volumes.clear();
    }

    protected getCustomStats(): Record<string, any> {
        return {
            volumeCount: this.volumes.size,
        };
    }

    private async updateVolumeState(volumeName: string, action?: VolumeAction): Promise<void> {
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

    private async refreshVolumeState(volumeName: string): Promise<void> {
        const volume = this.docker.getVolume(volumeName);
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

    private getStateChanges(oldState: Volume, newState: Volume): VolumeStateChanges {
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

    async hardRefresh(): Promise<void> {
        logger.info('Starting hard refresh of volume state');

        try {
            const volumesResponse = await this.docker.df();
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

import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';

export function getVolumesStateManager(): VolumesStateManager {
    const environmentId = getCurrentEnvironmentId();
    if (!environmentId) {
        const defaultId = dockerClientRegistry.getDefaultEnvironmentId();
        if (!defaultId) {
            throw new Error('No Docker environment available');
        }
        return stateManagerFactory.getManagers(defaultId).volumes;
    }
    return stateManagerFactory.getManagers(environmentId).volumes;
}

export const volumesStateManager = new Proxy({} as VolumesStateManager, {
    get(_target, prop) {
        const manager = getVolumesStateManager();
        const value = (manager as any)[prop];
        if (typeof value === 'function') {
            return value.bind(manager);
        }
        return value;
    },
});
