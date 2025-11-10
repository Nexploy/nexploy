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
