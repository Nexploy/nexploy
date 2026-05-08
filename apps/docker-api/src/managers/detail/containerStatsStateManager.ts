import { BaseSingleResourceStateManager } from '@/lib/base/BaseSingleResourceStateManager';
import {
    ContainerStats,
    ContainerStatsChanges,
    ContainerStatsEvent,
} from '@workspace/typescript-interface/docker/docker.container.stats';

export class ContainerStatsStateManager extends BaseSingleResourceStateManager<ContainerStats> {
    constructor(containerId: string, environmentId: string, pollIntervalMs: number = 5000) {
        super({
            resourceType: 'ContainerStats',
            resourceId: containerId,
            environmentId,
            pollIntervalMs,
            maxReconnectAttempts: 5,
            maxListeners: 50,
        });
    }

    async fetchResourceState(): Promise<ContainerStats> {
        const container = this.docker.getContainer(this.resourceId);
        const statsData = await container.stats({ stream: false });
        return this.parseContainerStats(statsData);
    }

    getEventFilters(): Record<string, string[]> {
        return {
            type: ['container'],
            container: [this.resourceId],
        };
    }

    shouldHandleEvent(action: string): boolean {
        return ['die', 'stop', 'destroy', 'pause', 'unpause'].includes(action);
    }

    isDestroyAction(action: string): boolean {
        return action === 'destroy';
    }

    hasStateChanged(oldState: ContainerStats, newState: ContainerStats): boolean {
        const cpuDiff = Math.abs(oldState.cpuPercent - newState.cpuPercent);
        const memDiff = Math.abs(oldState.memoryPercent - newState.memoryPercent);

        return cpuDiff > 0.1 || memDiff > 0.1 || oldState.timestamp !== newState.timestamp;
    }

    emitInitialState(state: ContainerStats): void {
        this.emit('initial-state', {
            type: 'initial-state',
            containerId: this.resourceId,
            stats: state,
            timestamp: Date.now(),
        });
    }

    emitStateChange(newState: ContainerStats, oldState: ContainerStats): void {
        const event: ContainerStatsEvent = {
            type: 'stats-update',
            containerId: this.resourceId,
            stats: newState,
            changes: this.getStatsChanges(oldState, newState),
            timestamp: Date.now(),
        };
        this.emit('stats-update', event);
    }

    emitRemoved(oldState: ContainerStats): void {
        const event: ContainerStatsEvent = {
            type: 'removed',
            containerId: this.resourceId,
            oldStats: oldState,
            timestamp: Date.now(),
        };
        this.emit('removed', event);
    }

    protected getCustomStats(): Record<string, any> {
        return {
            cpuPercent: this.currentState?.cpuPercent.toFixed(2),
            memoryPercent: this.currentState?.memoryPercent.toFixed(2),
            hasStats: this.currentState !== null,
        };
    }

    private getStatsChanges(
        oldStats: ContainerStats,
        newStats: ContainerStats,
    ): ContainerStatsChanges {
        return {
            cpuDelta: newStats.cpuPercent - oldStats.cpuPercent,
            memoryDelta: newStats.memoryUsage - oldStats.memoryUsage,
            networkRxDelta: newStats.networkRx - oldStats.networkRx,
            networkTxDelta: newStats.networkTx - oldStats.networkTx,
            blockReadDelta: newStats.blockRead - oldStats.blockRead,
            blockWriteDelta: newStats.blockWrite - oldStats.blockWrite,
        };
    }

    private parseContainerStats(stats: any): ContainerStats {
        const cpuDelta =
            stats.cpu_stats.cpu_usage.total_usage -
            (stats.precpu_stats.cpu_usage?.total_usage || 0);
        const systemDelta =
            stats.cpu_stats.system_cpu_usage - (stats.precpu_stats.system_cpu_usage || 0);
        const cpuCount = stats.cpu_stats.online_cpus || 1;
        const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * cpuCount * 100 : 0;

        const memoryUsage = stats.memory_stats.usage || 0;
        const memoryLimit = stats.memory_stats.limit || 1;
        const memoryPercent = (memoryUsage / memoryLimit) * 100;

        let networkRx = 0;
        let networkTx = 0;
        if (stats.networks) {
            for (const network of Object.values(stats.networks) as any[]) {
                networkRx += network.rx_bytes || 0;
                networkTx += network.tx_bytes || 0;
            }
        }

        let blockRead = 0;
        let blockWrite = 0;
        if (stats.blkio_stats?.io_service_bytes_recursive) {
            for (const entry of stats.blkio_stats.io_service_bytes_recursive) {
                if (entry.op === 'read') blockRead += entry.value;
                if (entry.op === 'write') blockWrite += entry.value;
            }
        }

        return {
            containerId: this.resourceId,
            timestamp: Date.now(),

            cpuPercent: Math.max(0, Math.min(100 * cpuCount, cpuPercent)),
            cpuUsage: stats.cpu_stats.cpu_usage.total_usage,
            systemCpuUsage: stats.cpu_stats.system_cpu_usage,
            onlineCpus: cpuCount,

            memoryUsage,
            memoryLimit,
            memoryPercent: Math.max(0, Math.min(100, memoryPercent)),
            memoryCache: stats.memory_stats.stats?.cache || 0,

            networkRx,
            networkTx,

            blockRead,
            blockWrite,

            pidsCount: stats.pids_stats?.current || 0,
        };
    }
}
