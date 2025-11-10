export interface LogEntry {
    timestamp: string;
    stream: 'stdout' | 'stderr';
    message: string;
}

export interface ContainerLogsEvent {
    type: 'log' | 'error' | 'end';
    containerId: string;
    log?: LogEntry;
    error?: string;
    endReason?: 'container_stopped' | 'stream_error' | 'manual_stop';
    timestamp: number;
}

export interface ContainerLogsState {
    containerId: string | null;
    logs: LogEntry[];
    isLoading: boolean;
    isConnected: boolean;
    error: Error | null;
    connectionState: 'connecting' | 'connected' | 'error' | 'disconnected';
    messageEnd?: string;
    lastUpdate: number | null;
    autoScroll: boolean;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;

    connect: (params: { containerId: string; follow?: boolean; tail?: number }) => void;
    disconnect: () => void;
    reconnect: () => void;
    addLog: (log: LogEntry) => void;
    addLogsBatch: (logs: LogEntry[]) => void;
    setAutoScroll: (autoScroll: boolean) => void;
    setError: (error: Error | null) => void;
    downloadLogs: (containerName?: string) => void;
}
