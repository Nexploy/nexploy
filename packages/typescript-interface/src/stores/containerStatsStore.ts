import { ContainerStats } from '../docker/docker.container.stats';

export interface ContainerStatsState {
    containerId: string | null;
    stats: ContainerStats | null;
    isLoading: boolean;
    isConnected: boolean;
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
    history: ContainerStats[];
    maxHistorySize: number;

    connect: (params: { containerId: string; refreshRate: string }) => void;
    disconnect: () => void;
    reconnect: () => void;
    setError: (error: Error | null) => void;
    clearStats: () => void;
    exportStats: (containerName?: string) => void;
}
