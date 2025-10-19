import { docker } from '@/utils/dockerClient';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { ContainerInfo, ContainerInspectInfo } from 'dockerode';
import byline from 'byline';
import { Container, DockerStatus, Ports } from '@workspace/typescript-interface/docker';

class ContainerStateManager extends EventEmitter {
    private containers: Map<string, Container> = new Map();
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
            logger.warn('Container state manager already running');
            return;
        }

        this.polling = true;
        logger.info('Starting container state manager');

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
        logger.info('Stopping container state manager');

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
        this.containers.clear();
        this.removeAllListeners();
    }

    private async loadInitialState() {
        try {
            const containers = await docker.listContainers({ all: true });

            for (const container of containers) {
                const state = this.parseContainerInfo(container);
                this.containers.set(state.id, state);
            }

            logger.info({ count: this.containers.size }, 'Initial container state loaded');
            this.emit('initial-state', Array.from(this.containers.values()));
        } catch (err) {
            logger.error({ err }, 'Error loading initial container state');
            throw err;
        }
    }

    private async startDockerEventsListener() {
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
        const containerId = event.Actor?.ID;
        if (!containerId) return;

        const action = event.Action;
        logger.debug({ containerId, action }, 'Docker event received');

        const stateChangeEvents = [
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

    private async updateContainerState(containerId: string, action?: string) {
        try {
            if (action === 'destroy') {
                const oldState = this.containers.get(containerId);
                this.containers.delete(containerId);

                if (oldState) {
                    this.emit('container-removed', { id: containerId, oldState });
                    this.emit('state-change', {
                        type: 'removed',
                        container: oldState,
                    });
                }
                return;
            }

            const container = docker.getContainer(containerId);
            const info = await container.inspect();
            const newState = this.parseContainerInspect(info);

            const oldState = this.containers.get(containerId);
            this.containers.set(containerId, newState);

            if (!oldState) {
                this.emit('container-added', newState);
                this.emit('state-change', {
                    type: 'added',
                    container: newState,
                });
            } else if (this.hasStateChanged(oldState, newState)) {
                this.emit('container-updated', { oldState, newState });
                this.emit('state-change', {
                    type: 'updated',
                    container: newState,
                    changes: this.getStateChanges(oldState, newState),
                });
            }
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.containers.get(containerId);
                this.containers.delete(containerId);

                if (oldState) {
                    this.emit('container-removed', { id: containerId, oldState });
                    this.emit('state-change', {
                        type: 'removed',
                        container: oldState,
                    });
                }
            } else {
                logger.error({ err, containerId }, 'Error updating container state');
            }
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

        logger.info({ interval: this.POLL_INTERVAL_MS }, 'Fallback polling started');
    }

    private async fullStateSync() {
        try {
            const containers = await docker.listContainers({ all: true });
            const currentIds = new Set(containers.map((c) => c.Id));

            for (const container of containers) {
                const newState = this.parseContainerInfo(container);
                const oldState = this.containers.get(newState.id);

                if (!oldState) {
                    this.containers.set(newState.id, newState);
                    this.emit('container-added', newState);
                    this.emit('state-change', {
                        type: 'added',
                        container: newState,
                    });
                } else if (this.hasStateChanged(oldState, newState)) {
                    this.containers.set(newState.id, newState);
                    this.emit('container-updated', { oldState, newState });
                    this.emit('state-change', {
                        type: 'updated',
                        container: newState,
                        changes: this.getStateChanges(oldState, newState),
                    });
                }
            }

            for (const [id, state] of this.containers) {
                if (!currentIds.has(id)) {
                    this.containers.delete(id);
                    this.emit('container-removed', { id, oldState: state });
                    this.emit('state-change', {
                        type: 'removed',
                        container: state,
                    });
                }
            }
        } catch (err) {
            logger.error('Error in full state sync');
            // Set status to error if sync fails
            if (this.dockerStatus === 'connected') {
                this.dockerStatus = 'error';
            }
        }
    }

    private parseContainerInfo(container: ContainerInfo): Container {
        const portsMap = new Map<string, Ports>();

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
        const portsMap = new Map<string, Ports>();
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

    private getStateChanges(oldState: Container, newState: Container) {
        const changes: any = {};

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

    getState(containerId: string): Container | undefined {
        return this.containers.get(containerId);
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
            containerCount: this.containers.size,
            eventStreamActive: this.dockerEventStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            polling: this.polling,
        };
    }
}

export const containerStateManager = new ContainerStateManager();
