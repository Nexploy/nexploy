import { logger } from '@/utils/logger';
import { ContainerCreateOptions, ContainerInfo, ContainerInspectInfo } from 'dockerode';
import {
    Containers,
    ContainersEvent,
    ContainersPorts,
    ContainersStateChanges,
    ContainersStateEvents,
} from '@workspace/typescript-interface/docker/docker.containers';
import { BaseStateManager } from '@/lib/BaseStateManager';
import { DeployOptions } from '@workspace/typescript-interface/inngest/deploy';
import { EventEmitter } from 'events';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import { networksStateManager } from '@/managers/networksStateManager';
import { TRAEFIK_NETWORK_NAME } from '@/lib/config';

export const containerImageEvents = new EventEmitter();

export class ContainersStateManager extends BaseStateManager {
    private containers: Map<string, Containers> = new Map();

    constructor(environmentId: string) {
        super({
            managerName: `Containers State Manager [${environmentId}]`,
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
            const containers = await this.docker.listContainers({ all: true });

            for (const container of containers) {
                const state = this.parseContainerInfo(container);
                this.containers.set(state.id, state);
            }

            logger.info({ count: this.containers.size }, 'Initial container state loaded');

            const initialStateData: ContainersEvent = {
                type: 'initial',
                containers: Array.from(this.containers.values()),
                timestamp: Date.now(),
            };
            this.emit('initial-state', initialStateData);
        } catch (err) {
            logger.error({ err }, 'Error loading initial container state');
            throw err;
        }
    }

    async handleDockerEvent(event: any): Promise<void> {
        try {
            if (!this.getDockerStatusManager().isConnected()) {
                logger.debug('Ignoring Docker event: Docker is not connected');
                return;
            }
        } catch (err) {
            logger.debug('Ignoring Docker event: Docker status manager not available');
            return;
        }

        const containerId = event.Actor?.ID;
        if (!containerId) return;

        const action = event.Action;
        logger.debug({ containerId, action }, 'Docker Container event received');

        const stateChangeEvents: ContainersStateEvents[] = [
            'start',
            'die',
            'stop',
            'pause',
            'unpause',
            'restart',
            'kill',
            'create',
            'destroy',
            'health_status',
        ];

        if (stateChangeEvents.includes(action)) {
            await this.updateContainerState(containerId, action);
        }
    }

    async fullStateSync(): Promise<void> {
        try {
            if (!this.getDockerStatusManager().isConnected()) {
                logger.debug('Skipping full state sync: Docker not connected');
                return;
            }
        } catch (err) {
            logger.debug('Skipping full state sync: Docker status manager not available');
            return;
        }

        try {
            const containers = await this.docker.listContainers({ all: true });

            for (const container of containers) {
                const newState = this.parseContainerInfo(container);
                const oldState = this.containers.get(newState.id);

                if (!oldState) {
                    this.containers.set(newState.id, newState);
                    const containerAddedData: ContainersEvent = {
                        type: 'added',
                        container: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('container-added', containerAddedData);
                    continue;
                }

                if (this.hasStateChanged(oldState, newState)) {
                    this.containers.set(newState.id, newState);
                    this.emit('state-change', {
                        type: 'updated',
                        container: newState,
                        changes: this.getStateChanges(oldState, newState),
                        timestamp: Date.now(),
                    });
                }
            }
        } catch (err) {
            logger.error({ err }, 'Error in full state sync');
        }
    }

    getEventFilters(): Record<string, string[]> {
        return { type: ['container'] };
    }

    protected onStop(): void {
        this.containers.clear();
    }

    protected getCustomStats(): Record<string, any> {
        return {
            containerCount: this.containers.size,
        };
    }

    private async updateContainerState(
        containerId: string,
        action: ContainersStateEvents,
    ): Promise<void> {
        try {
            if (!this.getDockerStatusManager().isConnected()) {
                logger.debug(
                    { containerId },
                    'Skipping container state update: Docker not connected',
                );
                return;
            }
        } catch (err) {
            logger.debug(
                { containerId },
                'Skipping container state update: Docker status manager not available',
            );
            return;
        }

        try {
            if (action === 'destroy') {
                const oldState = this.containers.get(containerId);
                this.containers.delete(containerId);

                if (oldState) {
                    this.emit('container-removed', { containerId, action, oldState });

                    containerImageEvents.emit('container-usage-changed', {
                        action: 'destroy',
                        containerId,
                        imageId: oldState.image,
                    });
                }
                return;
            }

            const container = this.docker.getContainer(containerId);
            const info = await container.inspect();
            const newState = this.parseContainerInspect(info);

            const oldState = this.containers.get(containerId);
            this.containers.set(containerId, newState);

            if (!oldState) {
                const containerAddedData: ContainersEvent = {
                    type: 'added',
                    action,
                    container: newState,
                    timestamp: Date.now(),
                };
                this.emit('container-added', containerAddedData);

                containerImageEvents.emit('container-usage-changed', {
                    action: 'create',
                    containerId: newState.id,
                    imageId: newState.image,
                });
            } else if (this.hasStateChanged(oldState, newState)) {
                const containerUpdatedData: ContainersEvent = {
                    type: 'updated',
                    action,
                    container: newState,
                    changes: this.getStateChanges(oldState, newState),
                    timestamp: Date.now(),
                };
                this.emit('container-updated', containerUpdatedData);

                if (oldState.state !== newState.state) {
                    containerImageEvents.emit('container-usage-changed', {
                        action: action,
                        containerId: newState.id,
                        imageId: newState.image,
                        stateChange: {
                            from: oldState.state,
                            to: newState.state,
                        },
                    });
                }
            }
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.containers.get(containerId);
                this.containers.delete(containerId);

                if (oldState) {
                    const containerRemovedData: ContainersEvent = {
                        type: 'removed',
                        containerId,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('container-removed', containerRemovedData);

                    containerImageEvents.emit('container-usage-changed', {
                        action: 'destroy',
                        containerId,
                        imageId: oldState.image,
                    });
                }
            } else {
                logger.error({ err, containerId }, 'Error updating container state');
            }
        }
    }

    private parseContainerInfo(container: ContainerInfo): Containers {
        const portsMap = new Map<string, ContainersPorts>();

        container.Ports?.forEach((port) => {
            const key = `${port.PrivatePort}-${port.PublicPort || 'none'}-${port.Type || 'tcp'}`;

            if (portsMap.has(key)) {
                const existing = portsMap.get(key)!;
                if (port.IP && !existing.hostIps.includes(port.IP)) {
                    existing.hostIps.push(port.IP);
                }
            } else {
                portsMap.set(key, {
                    privatePort: port.PrivatePort,
                    publicPort: port.PublicPort || 0,
                    hostIps: port.IP ? [port.IP] : [],
                    type: port.Type || 'tcp',
                });
            }
        });

        return {
            id: container.Id,
            name: container.Names?.[0]?.replace(/^\//, '') || 'unknown',
            labels: container.Labels,
            image: container.Image,
            status: container.Status,
            ports: Array.from(portsMap.values()),
            state: this.normalizeState(container.State),
            timestamp: Date.now(),
        };
    }

    private parseContainerInspect(info: ContainerInspectInfo): Containers {
        const portsMap = new Map<string, ContainersPorts>();
        const networkPorts = info.NetworkSettings?.Ports || {};

        for (const [portKey, bindings] of Object.entries(networkPorts)) {
            const [privatePortStr, type] = portKey.split('/');
            const privatePort = parseInt(privatePortStr);

            if (bindings && Array.isArray(bindings) && bindings.length > 0) {
                bindings.forEach((binding) => {
                    const publicPort = binding.HostPort ? parseInt(binding.HostPort) : 0;
                    const key = `${privatePort}-${publicPort}-${type}`;

                    if (portsMap.has(key)) {
                        const existing = portsMap.get(key)!;
                        if (binding.HostIp && !existing.hostIps.includes(binding.HostIp)) {
                            existing.hostIps.push(binding.HostIp);
                        }
                    } else {
                        portsMap.set(key, {
                            privatePort,
                            publicPort,
                            hostIps: binding.HostIp ? [binding.HostIp] : [],
                            type: type || 'tcp',
                        });
                    }
                });
            } else {
                const key = `${privatePort}-0-${type}`;
                if (!portsMap.has(key)) {
                    portsMap.set(key, {
                        privatePort,
                        publicPort: 0,
                        hostIps: [],
                        type: type || 'tcp',
                    });
                }
            }
        }

        return {
            id: info.Id,
            name: info.Name?.replace(/^\//, ''),
            labels: info.Config?.Labels,
            image: info.Config?.Image,
            status: info.State?.Status,
            ports: Array.from(portsMap.values()),
            state: this.normalizeState(info.State?.Status),
            health: info.State?.Health?.Status,
            exitCode: info.State?.ExitCode,
            error: info.State?.Error,
            timestamp: Date.now(),
        };
    }

    private normalizeState(dockerState: string): Containers['state'] {
        const state = dockerState?.toLowerCase();
        if (['running', 'paused', 'restarting', 'created', 'dead', 'exited'].includes(state)) {
            return state as Containers['state'];
        }
        return 'exited';
    }

    private hasStateChanged(oldState: Containers, newState: Containers): boolean {
        return (
            oldState.state !== newState.state ||
            oldState.status !== newState.status ||
            oldState.health !== newState.health ||
            oldState.exitCode !== newState.exitCode
        );
    }

    private getStateChanges(oldState: Containers, newState: Containers): ContainersStateChanges {
        const changes: ContainersStateChanges = {};

        if (oldState.state !== newState.state)
            changes.state = { from: oldState.state, to: newState.state };
        if (oldState.status !== newState.status)
            changes.status = { from: oldState.status, to: newState.status };
        if (oldState.health !== newState.health)
            changes.health = { from: oldState.health, to: newState.health };
        if (oldState.exitCode !== newState.exitCode)
            changes.exitCode = {
                from: oldState.exitCode,
                to: newState.exitCode,
            };

        return changes;
    }

    getAllStates(): Containers[] {
        return Array.from(this.containers.values());
    }

    getContainer(containerId: string): Containers | undefined {
        return this.containers.get(containerId);
    }

    async hardRefresh(): Promise<void> {
        try {
            if (!this.getDockerStatusManager().isConnected()) {
                logger.warn('Cannot hard refresh: Docker is not connected');
                throw new Error('Docker is not connected');
            }
        } catch (err) {
            logger.warn('Cannot hard refresh: Docker status manager not available');
            throw new Error('Docker status manager not available');
        }

        logger.info('Starting hard refresh of container states');

        try {
            const containers = await this.docker.listContainers({ all: true });
            const currentIds = new Set(containers.map((c) => c.Id));
            const oldIds = new Set(this.containers.keys());

            for (const oldId of oldIds) {
                if (!currentIds.has(oldId)) {
                    const oldState = this.containers.get(oldId);
                    this.containers.delete(oldId);

                    if (oldState) {
                        const containerRemovedData: ContainersEvent = {
                            type: 'removed',
                            containerId: oldId,
                            oldState,
                            timestamp: Date.now(),
                        };
                        this.emit('container-removed', containerRemovedData);
                    }
                }
            }

            for (const container of containers) {
                const newState = this.parseContainerInfo(container);
                const oldState = this.containers.get(newState.id);

                if (!oldState) {
                    this.containers.set(newState.id, newState);
                    const containerAddedData: ContainersEvent = {
                        type: 'added',
                        container: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('container-added', containerAddedData);
                } else if (this.hasStateChanged(oldState, newState)) {
                    this.containers.set(newState.id, newState);
                    const containerUpdatedData: ContainersEvent = {
                        type: 'updated',
                        container: newState,
                        changes: this.getStateChanges(oldState, newState),
                        timestamp: Date.now(),
                    };
                    this.emit('container-updated', containerUpdatedData);
                } else {
                    this.containers.set(newState.id, newState);
                }
            }

            logger.info({ count: this.containers.size }, 'Hard refresh completed');
        } catch (err) {
            logger.error({ err }, 'Error during hard refresh');
            throw err;
        }
    }

    async deploy(
        repositoryId: string,
        imageName: string,
        options: DeployOptions = {},
    ): Promise<{
        buildId: string;
        containerId: string;
        port?: number;
    }> {
        const containerName = options.containerName || `nexploy-${repositoryId}`;

        logger.info({ repositoryId, imageName, containerName }, 'Starting deployment');

        await this.removeExistingContainer(containerName);

        const traefikNetworkExist =
            await networksStateManager.ensureNetworkExists(TRAEFIK_NETWORK_NAME);

        const envArray = options.envVars
            ? Object.entries(options.envVars).map(([key, value]) => `${key}=${value}`)
            : [];

        let imageExposedPorts: Record<string, Record<string, never>> = {};
        try {
            const imageInfo = await this.docker.getImage(imageName).inspect();
            imageExposedPorts = imageInfo.Config?.ExposedPorts || {};
        } catch (err) {
            logger.warn({ err, imageName }, 'Failed to inspect image for exposed ports');
        }

        const containerConfig: ContainerCreateOptions = {
            name: containerName,
            Image: imageName,
            Env: envArray,
            ...(Object.keys(imageExposedPorts).length > 0 && { ExposedPorts: imageExposedPorts }),
            HostConfig: {
                RestartPolicy: { Name: 'unless-stopped' },
                ...(traefikNetworkExist && { NetworkMode: TRAEFIK_NETWORK_NAME }),
            },
        };

        const container = await this.docker.createContainer(containerConfig);
        await container.start();

        logger.info({ containerId: container.id }, 'Deployment started');

        return {
            buildId: containerName,
            containerId: container.id,
        };
    }

    private async removeExistingContainer(containerName: string): Promise<void> {
        try {
            const existing = this.docker.getContainer(containerName);
            const info = await existing.inspect();
            if (info.State.Running) {
                await existing.stop();
            }
            await existing.remove();
            logger.info({ containerName }, 'Removed existing container');
        } catch {}
    }
}

export function getContainersStateManager(): ContainersStateManager {
    const environmentId = getCurrentEnvironmentId();
    if (!environmentId) {
        const defaultId = dockerClientRegistry.getDefaultEnvironmentId();
        if (!defaultId) {
            throw new Error('No Docker environment available');
        }
        return stateManagerFactory.getManagers(defaultId).containers;
    }

    return stateManagerFactory.getManagers(environmentId).containers;
}

export const containersStateManager = new Proxy({} as ContainersStateManager, {
    get(_target, prop) {
        const manager = getContainersStateManager();
        const value = (manager as any)[prop];

        if (typeof value === 'function') {
            return value.bind(manager);
        }

        return value;
    },
});
