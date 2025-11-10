export interface ContainerStats {
    containerId: string;
    timestamp: number;

    cpuPercent: number;
    cpuUsage: number;
    systemCpuUsage: number;
    onlineCpus: number;

    memoryUsage: number;
    memoryLimit: number;
    memoryPercent: number;
    memoryCache: number;

    networkRx: number;
    networkTx: number;

    blockRead: number;
    blockWrite: number;

    pidsCount: number;
}

export interface ContainerStatsChanges {
    cpuDelta: number;
    memoryDelta: number;
    networkRxDelta: number;
    networkTxDelta: number;
    blockReadDelta: number;
    blockWriteDelta: number;
}

export type ContainerStatsEventType = 'initial-state' | 'stats-update' | 'removed';

export interface ContainerStatsEvent {
    type: ContainerStatsEventType;
    containerId: string;
    stats?: ContainerStats;
    oldStats?: ContainerStats;
    changes?: ContainerStatsChanges;
    timestamp: number;
}
