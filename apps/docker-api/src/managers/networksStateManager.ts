import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import { NetworkInspectInfo } from 'dockerode';
import {
    Network,
    NetworkAction,
    NetworkEvent,
    NetworkStateChanges,
} from '@workspace/typescript-interface/docker/docker.network';
import { dockerStatusManager } from '@/managers/dockerStatusManager';
import { BaseStateManager } from '@/lib/BaseStateManager';

class NetworksStateManager extends BaseStateManager {
    private networks: Map<string, Network> = new Map();

    constructor() {
        super({
            managerName: 'Network State Manager',
            pollIntervalMs: 10000,
            maxReconnectAttempts: 5,
            maxListeners: 100,
        });
    }

    async loadInitialState(): Promise<void> {
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

    async handleDockerEvent(event: any): Promise<void> {
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

    async fullStateSync(): Promise<void> {
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

    getEventFilters(): Record<string, string[]> {
        return { type: ['network'] };
    }

    protected onStop(): void {
        this.networks.clear();
    }

    protected getCustomStats(): Record<string, any> {
        return {
            networkCount: this.networks.size,
        };
    }

    private async updateNetworkState(networkId: string, action?: NetworkAction): Promise<void> {
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

    private async refreshNetworkState(networkId: string): Promise<void> {
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

export const networksStateManager = new NetworksStateManager();
