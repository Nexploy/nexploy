import { docker } from '@/utils/dockerClient';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { NetworkInspectInfo } from 'dockerode';
import byline from 'byline';
import {
    Network,
    NetworkAction,
    NetworkEvent,
    NetworkStateChanges,
} from '@workspace/typescript-interface/docker/docker.network';
import {
    DockerStatus,
    DockerStatusEvent,
} from '@workspace/typescript-interface/docker/docker.status';
import { dockerStatusManager } from '@/managers/dockerStatusManager';

class NetworkStateManager extends EventEmitter {
    private networks: Map<string, Network> = new Map();
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
                logger.info('Docker reconnected, reinitializing network manager');
                try {
                    logger.info('Sending networks after Docker reconnection');

                    await this.loadInitialState();
                    await this.startDockerEventsListener();
                    this.reconnectAttempts = 0;
                } catch (err) {
                    logger.error({ err }, 'Failed to reinitialize after Docker reconnection');
                }
            } else if (this.polling && event.status === 'disconnected') {
                logger.warn('Docker disconnected, stopping network event stream');
                if (this.dockerEventStream) {
                    try {
                        this.dockerEventStream.destroy();
                    } catch (err) {
                        logger.error({ err }, 'Error destroying Docker network event stream');
                    }
                    this.dockerEventStream = null;
                }
            }
        });
    }

    async start() {
        if (this.polling) {
            logger.warn('Network state manager already running');
            return;
        }

        this.polling = true;
        logger.info('Starting network state manager');

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
        logger.info('Stopping network state manager');

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

        this.networks.clear();
        this.removeAllListeners();
    }

    private async loadInitialState() {
        if (!dockerStatusManager.isConnected()) {
            logger.warn('Cannot load initial state: Docker is not connected');
            return;
        }

        try {
            const networks = await docker.listNetworks();

            for (const { Id } of networks) {
                const network = await docker.getNetwork(Id).inspect();

                const state = this.parseNetworkInfo(network);
                this.networks.set(state.id, state);
            }

            logger.info({ count: this.networks.size }, 'Initial network state loaded');

            const initialState: NetworkEvent = {
                type: 'initial',
                networks: Array.from(this.networks.values()),
                timestamp: Date.now(),
            };
            this.emit('initial-state', initialState);
        } catch (err) {
            logger.error({ err }, 'Error loading initial network state');
            throw err;
        }
    }

    private async startDockerEventsListener() {
        try {
            const stream = await docker.getEvents({
                filters: { type: ['network'] },
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
        const networkId = event.Actor?.ID;
        if (!networkId) return;

        const action = event.Action as NetworkAction;
        logger.debug({ networkId, action }, 'Docker Network event received');

        const stateChangeEvents: NetworkAction[] = [
            'create',
            'connect',
            'disconnect',
            'destroy',
            'remove',
        ];

        if (stateChangeEvents.includes(action)) {
            await this.updateNetworkState(networkId, action);
        }
    }

    private async updateNetworkState(networkId: string, action?: NetworkAction) {
        try {
            if (action === 'destroy' || action === 'remove') {
                const oldState = this.networks.get(networkId);
                if (oldState) {
                    this.networks.delete(networkId);
                    const networkRemovedData: NetworkEvent = {
                        type: 'removed',
                        networkId: oldState.id,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('network-removed', networkRemovedData);
                    logger.debug({ networkId }, 'Network deleted');
                }
                return;
            }

            await this.refreshNetworkState(networkId);
        } catch (err: any) {
            if (err.statusCode === 404) {
                const oldState = this.networks.get(networkId);
                this.networks.delete(networkId);

                if (oldState) {
                    const networkRemovedData: NetworkEvent = {
                        type: 'removed',
                        networkId: oldState.id,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('network-removed', networkRemovedData);
                }
            } else {
                logger.error({ err, networkId }, 'Error updating network state');
            }
        }
    }

    private async refreshNetworkState(networkId: string) {
        const network = docker.getNetwork(networkId);
        const info = await network.inspect();
        const newState = this.parseNetworkInfo(info);

        const oldState = this.networks.get(newState.id);
        this.networks.set(newState.id, newState);

        if (!oldState) {
            const networkAdded: NetworkEvent = {
                type: 'added',
                network: newState,
                timestamp: Date.now(),
            };
            this.emit('network-added', networkAdded);
        } else if (this.hasStateChanged(oldState, newState)) {
            const networkUpdated: NetworkEvent = {
                type: 'updated',
                oldState,
                network: newState,
                timestamp: Date.now(),
            };
            this.emit('network-updated', networkUpdated);
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

        logger.info({ interval: this.POLL_INTERVAL_MS }, 'Fallback Networks polling started');
    }

    private async fullStateSync() {
        try {
            const networks = await docker.listNetworks();

            for (const { Id } of networks) {
                const network = await docker.getNetwork(Id).inspect();

                const newState = this.parseNetworkInfo(network);
                const oldState = this.networks.get(newState.id);

                if (!oldState) continue;

                if (this.hasStateChanged(oldState, newState)) {
                    this.networks.set(newState.id, newState);

                    const stateChangeData: NetworkEvent = {
                        type: 'state-change',
                        networkId: newState.id,
                        network: newState,
                        changes: this.getStateChanges(oldState, newState),
                        timestamp: Date.now(),
                    };
                    this.emit('state-change', stateChangeData);
                }
            }
        } catch (err) {
            logger.error({ err }, 'Error in full state sync');
        }
    }

    private parseNetworkInfo(network: NetworkInspectInfo): Network {
        const containers = network.Containers || {};
        const connectedContainers = Object.keys(containers);

        return {
            id: network.Id,
            name: network.Name,
            driver: network.Driver,
            scope: network.Scope,
            internal: network.Internal || false,
            attachable: network.Attachable || false,
            ingress: network.Ingress || false,
            ipam: network.IPAM,
            containers: connectedContainers,
            options: network.Options || {},
            labels: network.Labels || {},
            created: network.Created
                ? new Date(network.Created).getTime() / 1000
                : Date.now() / 1000,
            enableIPv6: network.EnableIPv6 || false,
            timestamp: Date.now(),
        };
    }

    private hasStateChanged(oldState: Network, newState: Network): boolean {
        return (
            JSON.stringify(oldState.containers) !== JSON.stringify(newState.containers) ||
            oldState.internal !== newState.internal ||
            oldState.attachable !== newState.attachable ||
            JSON.stringify(oldState.labels) !== JSON.stringify(newState.labels)
        );
    }

    private getStateChanges(oldState: Network, newState: Network): NetworkStateChanges {
        const changes: NetworkStateChanges = {};

        if (JSON.stringify(oldState.containers) !== JSON.stringify(newState.containers))
            changes.containers = { from: oldState.containers, to: newState.containers };
        if (oldState.internal !== newState.internal)
            changes.internal = { from: oldState.internal, to: newState.internal };
        if (oldState.attachable !== newState.attachable)
            changes.attachable = { from: oldState.attachable, to: newState.attachable };
        if (JSON.stringify(oldState.labels) !== JSON.stringify(newState.labels))
            changes.labels = { from: oldState.labels, to: newState.labels };

        return changes;
    }

    getAllNetworks(): Network[] {
        return Array.from(this.networks.values());
    }

    getState(networkId: string): Network | undefined {
        return this.networks.get(networkId);
    }

    getStats() {
        return {
            networkCount: this.networks.size,
            eventStreamActive: this.dockerEventStream !== null,
            reconnectAttempts: this.reconnectAttempts,
            polling: this.polling,
        };
    }

    getByName(name: string): Network | undefined {
        for (const network of this.networks.values()) {
            if (network.name === name) {
                return network;
            }
        }
        return undefined;
    }

    async hardRefresh(): Promise<void> {
        logger.info('Starting hard refresh of network state');

        try {
            const networks = await docker.listNetworks();
            const newNetworkMap = new Map<string, Network>();

            for (const { Id } of networks) {
                const network = await docker.getNetwork(Id).inspect();

                const state = this.parseNetworkInfo(network);
                newNetworkMap.set(state.id, state);
            }

            for (const [networkId, oldState] of this.networks.entries()) {
                if (!newNetworkMap.has(networkId)) {
                    const networkRemovedData: NetworkEvent = {
                        type: 'removed',
                        networkId: oldState.id,
                        oldState,
                        timestamp: Date.now(),
                    };
                    this.emit('network-removed', networkRemovedData);
                    logger.debug({ networkId }, 'Network detected as removed during hard refresh');
                }
            }

            for (const [networkId, newState] of newNetworkMap.entries()) {
                const oldState = this.networks.get(networkId);

                if (!oldState) {
                    const networkAdded: NetworkEvent = {
                        type: 'added',
                        network: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('network-added', networkAdded);
                    logger.debug({ networkId }, 'Network detected as added during hard refresh');
                } else if (this.hasStateChanged(oldState, newState)) {
                    const networkUpdated: NetworkEvent = {
                        type: 'updated',
                        oldState,
                        network: newState,
                        timestamp: Date.now(),
                    };
                    this.emit('network-updated', networkUpdated);
                    logger.debug({ networkId }, 'Network detected as updated during hard refresh');
                }
            }

            this.networks = newNetworkMap;

            logger.info({ count: this.networks.size }, 'Hard refresh completed successfully');
        } catch (err) {
            logger.error({ err }, 'Error during hard refresh of network state');
            throw err;
        }
    }
}

export const networkStateManager = new NetworkStateManager();
