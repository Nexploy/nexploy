import { docker } from '@/utils/dockerClient';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { ContainerInfo, ContainerInspectInfo } from 'dockerode';
import byline from 'byline';
import {
    Container,
    ContainerEvent,
    ContainerPorts,
    ContainerStateChanges,
    ContainerStateEvents,
} from '@workspace/typescript-interface/docker.container';
import { DockerStatus, DockerStatusEvent } from '@workspace/typescript-interface/docker.status';
import { dockerStatusManager } from '@/services/dockerStatusManager';

class ContainerStateManager extends EventEmitter {
    private containers: Map<string, Container> = new Map();
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
                logger.info('Docker reconnected, reinitializing container manager');
                try {
                    logger.info('Sending containers after Docker reconnection');

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
            logger.warn('Container state manager already running');
            return;
        }

        this.polling = true;
        logger.info('Starting container state manager');

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
        logger.info('Stopping container state manager');

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

        this.containers.clear();
        this.removeAllListeners();
    }

    private async loadInitialState() {
        if (!dockerStatusManager.isConnected()) {
            logger.warn('Cannot load initial state: Docker is not connected');
            return;
        }

        try {
            const containers = await docker.listContainers({ all: true });

            for (const container of containers) {
                const state = this.parseContainerInfo(container);
                this.containers.set(state.id, state);
            }

            logger.info({ count: this.containers.size }, 'Initial container state loaded');

            const initialStateData: ContainerEvent = {
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

    private async startDockerEventsListener() {
        if (!dockerStatusManager.isConnected()) {
            logger.warn('Cannot start events listener: Docker is not connected');
            return;
        }

        try {
            const stream = await docker.getEvents({
                filters: { type: ['container'] },
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
        if (!dockerStatusManager.isConnected()) {
            logger.debug('Ignoring Docker event: Docker is not connected');
            return;
        }

        const containerId = event.Actor?.ID;
        if (!containerId) return;

        const action = event.Action;
        logger.debug({ containerId, action }, 'Docker Container event received');

        const stateChangeEvents: ContainerStateEvents[] = [
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

    private async updateContainerState(containerId: string, action: ContainerStateEvents) {
        if (!dockerStatusManager.isConnected()) {
            logger.debug({ containerId }, 'Skipping container state update: Docker not connected');
            return;
        }

        try {
            if (action === 'destroy') {
                const oldState = this.containers.get(containerId);
                this.containers.delete(containerId);

                if (oldState) {
                    this.emit('container-removed', { containerId, action, oldState });
                }
                return;
            }

            const container = docker.getContainer(containerId);
            const info = await container.inspect();
            const newState = this.parseContainerInspect(info);

            const oldState = this.containers.get(containerId);
            this.containers.set(containerId, newState);

            if (!oldState) {
                const containerAddedData: ContainerEvent = {
                    type: 'added',
                    action,
                    container: newState,
                    timestamp: Date.now(),
                };
                this.emit('container-added', containerAddedData);
            } else if (this.hasStateChanged(oldState, newState)) {
                const containerUpdatedData: ContainerEvent = {
                    type: 'updated',
                    action,
                    container: newState,
                    changes: this.getStateChanges(oldState, newState),
                    timestamp: Date.now(),
                };
                this.emit('container-updated', containerUpdatedData);
            }
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.containers.get(containerId);
                this.containers.delete(containerId);

                if (oldState) {
                    const containerRemovedData: ContainerEvent = {
                        type: 'removed',
                        containerId,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('container-removed', containerRemovedData);
                }
            } else {
                logger.error({ err, containerId }, 'Error updating container state');
            }
        }
    }

    private startFallbackPolling() {
        this.pollInterval = setInterval(async () => {
            if (!this.polling) return;

            if (!dockerStatusManager.isConnected()) {
                logger.debug('Skipping Container poll: Docker not connected');
                return;
            }

            try {
                await this.fullStateSync();
            } catch (err) {
                logger.error({ err }, 'Error in fallback polling');
            }
        }, this.POLL_INTERVAL_MS);

        logger.info({ interval: this.POLL_INTERVAL_MS }, 'Fallback Containers polling started');
    }

    private async fullStateSync() {
        if (!dockerStatusManager.isConnected()) {
            logger.debug('Skipping full state sync: Docker not connected');
            return;
        }

        try {
            const containers = await docker.listContainers({ all: true });

            for (const container of containers) {
                const newState = this.parseContainerInfo(container);
                const oldState = this.containers.get(newState.id);

                if (!oldState) return;

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

    private parseContainerInfo(container: ContainerInfo): Container {
        const portsMap = new Map<string, ContainerPorts>();

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

    private parseContainerInspect(info: ContainerInspectInfo): Container {
        const portsMap = new Map<string, ContainerPorts>();
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

    private normalizeState(dockerState: string): Container['state'] {
        const state = dockerState?.toLowerCase();
        if (['running', 'paused', 'restarting', 'created', 'dead', 'exited'].includes(state)) {
            return state as Container['state'];
        }
        return 'exited';
    }

    private hasStateChanged(oldState: Container, newState: Container): boolean {
        return (
            oldState.state !== newState.state ||
            oldState.status !== newState.status ||
            oldState.health !== newState.health ||
            oldState.exitCode !== newState.exitCode
        );
    }

    private getStateChanges(oldState: Container, newState: Container): ContainerStateChanges {
        const changes: ContainerStateChanges = {};

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

    getAllStates(): Container[] {
        return Array.from(this.containers.values());
    }

    getContainer(containerId: string): Container | undefined {
        return this.containers.get(containerId);
    }

    getStats() {
        return {
            containerCount: this.containers.size,
            eventStreamActive: this.dockerEventStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            polling: this.polling,
            dockerConnected: dockerStatusManager.isConnected(),
        };
    }

    async hardRefresh(): Promise<void> {
        if (!dockerStatusManager.isConnected()) {
            logger.warn('Cannot hard refresh: Docker is not connected');
            throw new Error('Docker is not connected');
        }

        logger.info('Starting hard refresh of container states');

        try {
            const containers = await docker.listContainers({ all: true });
            const currentIds = new Set(containers.map((c) => c.Id));
            const oldIds = new Set(this.containers.keys());

            for (const oldId of oldIds) {
                if (!currentIds.has(oldId)) {
                    const oldState = this.containers.get(oldId);
                    this.containers.delete(oldId);

                    if (oldState) {
                        const containerRemovedData: ContainerEvent = {
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
                    const containerAddedData: ContainerEvent = {
                        type: 'added',
                        container: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('container-added', containerAddedData);
                } else if (this.hasStateChanged(oldState, newState)) {
                    this.containers.set(newState.id, newState);
                    const containerUpdatedData: ContainerEvent = {
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
}

export const containerStateManager = new ContainerStateManager();
