import { ContainerState } from './docker.container';
import { ContainerStats } from './docker.container.stats';

export interface ContainerStatsSample extends ContainerStats {
    name: string;
    image: string;
    state: ContainerState;
    stack?: string;
    networkRxRate: number;
    networkTxRate: number;
    blockReadRate: number;
    blockWriteRate: number;
}

export interface ContainersStatsTotals {
    containerCount: number;
    runningCount: number;
    cpuPercent: number;
    memoryUsage: number;
    memoryLimit: number;
    memoryPercent: number;
    networkRxRate: number;
    networkTxRate: number;
    blockReadRate: number;
    blockWriteRate: number;
    pidsCount: number;
}

export type ContainersStatsEventType = 'initial-state' | 'stats-update' | 'error';

export interface ContainersStatsEvent {
    type: ContainersStatsEventType;
    stats: ContainerStatsSample[];
    totals: ContainersStatsTotals;
    timestamp: number;
    error?: string;
}
