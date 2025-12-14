import { SystemMetrics } from '../../monitoring/system.metrics';

export interface MonitoringStateParams {
    refreshRate: string;
}

export interface MonitoringState {
    metrics: SystemMetrics | null;
    isLoading: boolean;
    isConnected: boolean;
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
    history: SystemMetrics[];
    maxHistorySize: number;

    connect: ({ refreshRate }: { refreshRate: string }) => void;
    disconnect: () => void;
    reconnect: () => void;
    setError: (error: Error | null) => void;
    clearMetrics: () => void;
    exportMetrics: () => void;
}
