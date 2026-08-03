import { EventEmitter } from 'events';
import type Docker from 'dockerode';
import type { ContainerInfo } from 'dockerode';
import { logger } from '@/utils/logger';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import { ContainerState } from '@workspace/typescript-interface/docker/docker.container';
import {
    ContainersStatsEvent,
    ContainersStatsTotals,
    ContainerStatsSample,
} from '@workspace/typescript-interface/docker/docker.containers.stats';

const MAX_CONCURRENT_STATS_CALLS = 24;
const CONTAINER_STATES: ContainerState[] = ['created', 'running', 'restarting', 'paused', 'exited', 'dead'];

interface CounterSample {
    timestamp: number;
    cpuUsage: number;
    systemCpuUsage: number;
    networkRx: number;
    networkTx: number;
    blockRead: number;
    blockWrite: number;
}

async function mapWithConcurrency<TInput, TOutput>(
    items: TInput[],
    limit: number,
    handler: (item: TInput) => Promise<TOutput>,
): Promise<TOutput[]> {
    const results: TOutput[] = new Array(items.length);
    let cursor = 0;

    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length) {
            const index = cursor++;
            results[index] = await handler(items[index]!);
        }
    });

    await Promise.all(workers);

    return results;
}

export class ContainersStatsManager extends EventEmitter {
    private readonly docker: Docker;
    private readonly environmentId: string;
    private readonly pollIntervalMs: number;
    private previousSamples: Map<string, CounterSample> = new Map();
    private pollInterval: NodeJS.Timeout | null = null;
    private monitoring = false;
    private polling = false;
    private currentStats: ContainerStatsSample[] = [];
    private currentTotals: ContainersStatsTotals | null = null;

    constructor(environmentId: string, pollIntervalMs = 5000) {
        super();
        this.environmentId = environmentId;
        this.pollIntervalMs = Math.max(1000, pollIntervalMs);
        this.docker = dockerClientRegistry.getClient(environmentId);
        this.setMaxListeners(50);
    }

    async start(): Promise<void> {
        if (this.monitoring) return;
        this.monitoring = true;

        void this.poll('initial-state');

        this.pollInterval = setInterval(() => {
            void this.poll('stats-update');
        }, this.pollIntervalMs);
    }

    stop(): void {
        this.monitoring = false;

        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }

        this.previousSamples.clear();
        this.currentStats = [];
        this.currentTotals = null;
        this.removeAllListeners();
    }

    getCurrentEvent(): ContainersStatsEvent | null {
        if (!this.currentTotals) return null;

        return {
            type: 'initial-state',
            stats: this.currentStats,
            totals: this.currentTotals,
            timestamp: Date.now(),
        };
    }

    private isDockerConnected(): boolean {
        return stateManagerFactory.getManagersSafe(this.environmentId)?.dockerStatus.isConnected() ?? false;
    }

    private async poll(type: ContainersStatsEvent['type']): Promise<void> {
        if (!this.monitoring || this.polling) return;

        if (!this.isDockerConnected()) {
            this.emit('stream-error', {
                type: 'error',
                stats: [],
                totals: this.buildTotals([]),
                error: 'Docker is not connected',
                timestamp: Date.now(),
            } satisfies ContainersStatsEvent);
            return;
        }

        this.polling = true;

        try {
            const containers = await this.docker.listContainers({ all: true });

            const stats = await mapWithConcurrency(containers, MAX_CONCURRENT_STATS_CALLS, (container) =>
                this.buildSample(container),
            );

            const liveIds = new Set(containers.map((container) => container.Id));
            for (const containerId of this.previousSamples.keys()) {
                if (!liveIds.has(containerId)) {
                    this.previousSamples.delete(containerId);
                }
            }

            stats.sort((a, b) => b.cpuPercent - a.cpuPercent);

            this.currentStats = stats;
            this.currentTotals = this.buildTotals(stats);

            if (!this.monitoring) return;

            this.emit(type, {
                type,
                stats,
                totals: this.currentTotals,
                timestamp: Date.now(),
            } satisfies ContainersStatsEvent);
        } catch (err) {
            logger.error({ err, environmentId: this.environmentId }, 'Error collecting containers stats');

            if (!this.monitoring) return;

            this.emit('stream-error', {
                type: 'error',
                stats: [],
                totals: this.buildTotals([]),
                error: 'Failed to collect containers stats',
                timestamp: Date.now(),
            } satisfies ContainersStatsEvent);
        } finally {
            this.polling = false;
        }
    }

    private async buildSample(container: ContainerInfo): Promise<ContainerStatsSample> {
        const name = container.Names?.[0]?.replace(/^\//, '') || 'unknown';
        const state = this.normalizeState(container.State);
        const base: ContainerStatsSample = {
            containerId: container.Id,
            name,
            image: container.Image,
            state,
            stack: container.Labels?.['com.docker.compose.project'],
            timestamp: Date.now(),

            cpuPercent: 0,
            cpuUsage: 0,
            systemCpuUsage: 0,
            onlineCpus: 0,

            memoryUsage: 0,
            memoryLimit: 0,
            memoryPercent: 0,
            memoryCache: 0,

            networkRx: 0,
            networkTx: 0,
            networkRxRate: 0,
            networkTxRate: 0,

            blockRead: 0,
            blockWrite: 0,
            blockReadRate: 0,
            blockWriteRate: 0,

            pidsCount: 0,
        };

        if (state !== 'running') {
            this.previousSamples.delete(container.Id);
            return base;
        }

        try {
            const raw: any = await this.docker.getContainer(container.Id).stats({ stream: false, 'one-shot': true });
            return this.parseStats(base, raw);
        } catch (err) {
            logger.debug({ err, containerId: container.Id }, 'Failed to read container stats');
            return base;
        }
    }

    private parseStats(base: ContainerStatsSample, raw: any): ContainerStatsSample {
        const timestamp = Date.now();
        const previous = this.previousSamples.get(base.containerId);

        const cpuUsage = raw.cpu_stats?.cpu_usage?.total_usage ?? 0;
        const systemCpuUsage = raw.cpu_stats?.system_cpu_usage ?? 0;
        const onlineCpus = raw.cpu_stats?.online_cpus || raw.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;

        const previousCycleCpuUsage = raw.precpu_stats?.cpu_usage?.total_usage ?? 0;
        const previousCycleSystemCpuUsage = raw.precpu_stats?.system_cpu_usage ?? 0;

        let cpuDelta = 0;
        let systemDelta = 0;

        if (previous) {
            cpuDelta = cpuUsage - previous.cpuUsage;
            systemDelta = systemCpuUsage - previous.systemCpuUsage;
        } else if (previousCycleSystemCpuUsage > 0) {
            cpuDelta = cpuUsage - previousCycleCpuUsage;
            systemDelta = systemCpuUsage - previousCycleSystemCpuUsage;
        }

        const cpuPercent = systemDelta > 0 && cpuDelta > 0 ? (cpuDelta / systemDelta) * onlineCpus * 100 : 0;

        const memoryUsage = Math.max(0, (raw.memory_stats?.usage ?? 0) - (raw.memory_stats?.stats?.inactive_file ?? 0));
        const memoryLimit = raw.memory_stats?.limit || 0;

        let networkRx = 0;
        let networkTx = 0;
        if (raw.networks) {
            for (const network of Object.values(raw.networks) as any[]) {
                networkRx += network.rx_bytes || 0;
                networkTx += network.tx_bytes || 0;
            }
        }

        let blockRead = 0;
        let blockWrite = 0;
        for (const entry of raw.blkio_stats?.io_service_bytes_recursive ?? []) {
            const op = String(entry.op).toLowerCase();
            if (op === 'read') blockRead += entry.value || 0;
            if (op === 'write') blockWrite += entry.value || 0;
        }

        const elapsedSeconds = previous ? (timestamp - previous.timestamp) / 1000 : 0;
        const toRate = (current: number, before: number) =>
            elapsedSeconds > 0 ? Math.max(0, (current - before) / elapsedSeconds) : 0;

        this.previousSamples.set(base.containerId, {
            timestamp,
            cpuUsage,
            systemCpuUsage,
            networkRx,
            networkTx,
            blockRead,
            blockWrite,
        });

        return {
            ...base,
            timestamp,

            cpuPercent: Math.max(0, Math.min(100 * onlineCpus, cpuPercent)),
            cpuUsage,
            systemCpuUsage,
            onlineCpus,

            memoryUsage,
            memoryLimit,
            memoryPercent: memoryLimit > 0 ? Math.min(100, (memoryUsage / memoryLimit) * 100) : 0,
            memoryCache: raw.memory_stats?.stats?.cache ?? 0,

            networkRx,
            networkTx,
            networkRxRate: previous ? toRate(networkRx, previous.networkRx) : 0,
            networkTxRate: previous ? toRate(networkTx, previous.networkTx) : 0,

            blockRead,
            blockWrite,
            blockReadRate: previous ? toRate(blockRead, previous.blockRead) : 0,
            blockWriteRate: previous ? toRate(blockWrite, previous.blockWrite) : 0,

            pidsCount: raw.pids_stats?.current ?? 0,
        };
    }

    private buildTotals(stats: ContainerStatsSample[]): ContainersStatsTotals {
        const totals = stats.reduce(
            (acc, stat) => ({
                cpuPercent: acc.cpuPercent + stat.cpuPercent,
                memoryUsage: acc.memoryUsage + stat.memoryUsage,
                memoryLimit: Math.max(acc.memoryLimit, stat.memoryLimit),
                networkRxRate: acc.networkRxRate + stat.networkRxRate,
                networkTxRate: acc.networkTxRate + stat.networkTxRate,
                blockReadRate: acc.blockReadRate + stat.blockReadRate,
                blockWriteRate: acc.blockWriteRate + stat.blockWriteRate,
                pidsCount: acc.pidsCount + stat.pidsCount,
            }),
            {
                cpuPercent: 0,
                memoryUsage: 0,
                memoryLimit: 0,
                networkRxRate: 0,
                networkTxRate: 0,
                blockReadRate: 0,
                blockWriteRate: 0,
                pidsCount: 0,
            },
        );

        return {
            ...totals,
            containerCount: stats.length,
            runningCount: stats.filter((stat) => stat.state === 'running').length,
            memoryPercent: totals.memoryLimit > 0 ? (totals.memoryUsage / totals.memoryLimit) * 100 : 0,
        };
    }

    private normalizeState(dockerState: string): ContainerState {
        const state = dockerState?.toLowerCase() as ContainerState;
        return CONTAINER_STATES.includes(state) ? state : 'exited';
    }
}
