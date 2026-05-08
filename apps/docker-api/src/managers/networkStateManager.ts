import dayjs from 'dayjs';
import { NetworkInspectInfo } from 'dockerode';
import { Network, NetworkDetailEvent } from '@workspace/typescript-interface/docker/docker.network';
import { BaseSingleResourceStateManager } from '@/lib/BaseSingleResourceStateManager';

export class NetworkStateManager extends BaseSingleResourceStateManager<Network> {
    constructor(networkId: string, environmentId: string) {
        super({
            resourceType: 'Network',
            resourceId: networkId,
            environmentId,
            pollIntervalMs: 10000,
            maxReconnectAttempts: 5,
            maxListeners: 50,
        });
    }

    async fetchResourceState(): Promise<Network> {
        const info = await this.docker.getNetwork(this.resourceId).inspect();
        return this.parseNetworkInfo(info);
    }

    getEventFilters(): Record<string, string[]> {
        return {
            type: ['network'],
            network: [this.resourceId],
        };
    }

    shouldHandleEvent(action: string): boolean {
        return ['create', 'connect', 'disconnect', 'update'].includes(action);
    }

    isDestroyAction(action: string): boolean {
        return action === 'destroy' || action === 'remove';
    }

    hasStateChanged(oldState: Network, newState: Network): boolean {
        return (
            JSON.stringify(oldState.containers) !== JSON.stringify(newState.containers) ||
            oldState.internal !== newState.internal ||
            oldState.attachable !== newState.attachable ||
            JSON.stringify(oldState.labels) !== JSON.stringify(newState.labels) ||
            oldState.driver !== newState.driver ||
            oldState.scope !== newState.scope ||
            oldState.enableIPv6 !== newState.enableIPv6 ||
            JSON.stringify(oldState.ipam) !== JSON.stringify(newState.ipam) ||
            JSON.stringify(oldState.options) !== JSON.stringify(newState.options)
        );
    }

    emitInitialState(state: Network): void {
        const event: NetworkDetailEvent = {
            type: 'initial-state',
            networkId: this.resourceId,
            network: state,
            timestamp: Date.now(),
        };
        this.emit('initial-state', event);
    }

    emitStateChange(newState: Network, _oldState: Network): void {
        const event: NetworkDetailEvent = {
            type: 'state-change',
            networkId: this.resourceId,
            network: newState,
            timestamp: Date.now(),
        };
        this.emit('state-change', event);
    }

    emitRemoved(_oldState: Network): void {
        const event: NetworkDetailEvent = {
            type: 'removed',
            networkId: this.resourceId,
            timestamp: Date.now(),
        };
        this.emit('removed', event);
    }

    protected getCustomStats(): Record<string, any> {
        return {
            currentState: this.currentState?.name,
            hasState: this.currentState !== null,
        };
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
}
