import { ContainersStatsTotals, ContainerStatsSample } from '../../docker/docker.containers.stats';

export interface ContainersStatsParams {
    refreshRate: string;
}

export interface ContainersStatsHistoryPoint {
    timestamp: number;
    cpuPercent: number;
    memoryUsage: number;
    memoryPercent: number;
    networkRxRate: number;
    networkTxRate: number;
    blockReadRate: number;
    blockWriteRate: number;
    pidsCount: number;
}

export interface ContainersStatsTotalsHistoryPoint extends ContainersStatsHistoryPoint {
    runningCount: number;
    containerCount: number;
}

export interface ContainersStatsState {
    stats: ContainerStatsSample[];
    totals: ContainersStatsTotals | null;
    history: Record<string, ContainersStatsHistoryPoint[]>;
    totalsHistory: ContainersStatsTotalsHistoryPoint[];
    isLoading: boolean;
    isConnected: boolean;
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
    maxHistorySize: number;

    connect: ({ refreshRate }: ContainersStatsParams) => void;
    disconnect: () => void;
    reconnect: () => void;
    setError: (error: Error | null) => void;
    clearStats: () => void;
    reset: () => void;
    exportStats: () => void;
}
