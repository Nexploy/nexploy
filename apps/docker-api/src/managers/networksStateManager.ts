import { logger } from '@/utils/logger';
import dayjs from 'dayjs';
import { NetworkInspectInfo } from 'dockerode';
import {
    Network,
    NetworkAction,
    NetworkEvent,
    NetworkStateChanges,
} from '@workspace/typescript-interface/docker/docker.network';
import { BaseStateManager } from '@/lib/BaseStateManager';
import { getCurrentEnvironmentId } from '@/lib/dockerContext';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';

const NETWORK_STATE_CHANGE_EVENTS = new Set<NetworkAction>([
    'create',
    'connect',
    'disconnect',
    'destroy',
    'remove',
]);

export class NetworksStateManager extends BaseStateManager {
    private networks: Map<string, Network> = new Map();

    constructor(environmentId: string) {
        super({
            managerName: `Network State Manager [${environmentId}]`,
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
            const networks = await this.docker.listNetworks();
            const inspected = await Promise.all(
                networks.map(({ Id }) => this.docker.getNetwork(Id).inspect()),
            );

            for (const network of inspected) {
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

        if (NETWORK_STATE_CHANGE_EVENTS.has(action)) {
            await this.updateNetworkState(networkId, action);
        }
    }

    async fullStateSync(): Promise<void> {
        try {
            const networks = await this.docker.listNetworks();
            const inspected = await Promise.all(
                networks.map(({ Id }) => this.docker.getNetwork(Id).inspect()),
            );

            for (const network of inspected) {
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
        const network = this.docker.getNetwork(networkId);
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
            name: network.Name || '<none>',
            driver: network.Driver,
            scope: network.Scope,
            internal: network.Internal || false,
            attachable: network.Attachable || false,
            ingress: network.Ingress || false,
            ipam: network.IPAM,
            containers: connectedContainers,
            options: network.Options || {},
            labels: network.Labels || {},
            created: network.Created ? dayjs(network.Created).unix() : dayjs().unix(),
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

        const oldContainers = JSON.stringify(oldState.containers);
        const newContainers = JSON.stringify(newState.containers);
        const oldLabels = JSON.stringify(oldState.labels);
        const newLabels = JSON.stringify(newState.labels);

        if (oldContainers !== newContainers)
            changes.containers = { from: oldState.containers, to: newState.containers };
        if (oldState.internal !== newState.internal)
            changes.internal = { from: oldState.internal, to: newState.internal };
        if (oldState.attachable !== newState.attachable)
            changes.attachable = { from: oldState.attachable, to: newState.attachable };
        if (oldLabels !== newLabels)
            changes.labels = { from: oldState.labels, to: newState.labels };

        return changes;
    }

    getAllNetworks(): Network[] {
        return Array.from(this.networks.values());
    }

    getById(id: string): Network | undefined {
        return this.networks.get(id);
    }

    getByName(name: string): Network | undefined {
        for (const network of this.networks.values()) {
            if (network.name === name) {
                return network;
            }
        }
        return undefined;
    }

    async ensureNetworkExists(networkName: string): Promise<boolean> {
        try {
            const networks = await this.docker.listNetworks({
                filters: { name: [networkName] },
            });

            if (networks.length === 0) {
                logger.warn({ networkName }, 'Network does not exist');
                return false;
            } else {
                logger.debug({ networkName }, 'Network already exists');
                return true;
            }
        } catch (error: any) {
            logger.error({ error, networkName }, 'Failed to check network existence');
            throw new Error(`Failed to check network ${networkName}: ${error.message}`);
        }
    }

    async hardRefresh(): Promise<void> {
        logger.info('Starting hard refresh of network state');

        try {
            const networks = await this.docker.listNetworks();
            const newNetworkMap = new Map<string, Network>();
            const inspected = await Promise.all(
                networks.map(({ Id }) => this.docker.getNetwork(Id).inspect()),
            );

            for (const network of inspected) {
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

export function getNetworksStateManager(): NetworksStateManager {
    const environmentId = getCurrentEnvironmentId();
    if (!environmentId) {
        const defaultId = dockerClientRegistry.getDefaultEnvironmentId();
        if (!defaultId) {
            throw new Error('No Docker environment available');
        }
        return stateManagerFactory.getManagers(defaultId).networks;
    }
    return stateManagerFactory.getManagers(environmentId).networks;
}

export const networksStateManager = new Proxy({} as NetworksStateManager, {
    get(_target, prop) {
        const manager = getNetworksStateManager();
        const value = (manager as any)[prop];
        if (typeof value === 'function') {
            return value.bind(manager);
        }
        return value;
    },
});
