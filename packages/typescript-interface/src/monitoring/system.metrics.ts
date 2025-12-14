export interface SystemMetrics {
    timestamp: number;

    cpuPercent: number;
    cpuCount: number;
    cpuModel: string;
    loadAverage: number[];

    memoryTotal: number;
    memoryUsed: number;
    memoryFree: number;
    memoryPercent: number;

    diskTotal: number;
    diskUsed: number;
    diskFree: number;
    diskPercent: number;

    uptime: number;
    platform: string;
    hostname: string;
}

export interface SystemMetricsEvent {
    type: 'initial-state' | 'metrics-update' | 'heartbeat' | 'error';
    metrics?: SystemMetrics;
    timestamp: number;
    error?: string;
}
