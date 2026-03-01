import { create } from 'zustand';
import dayjs from 'dayjs';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import {
    MonitoringState,
    MonitoringStateParams,
} from '@workspace/typescript-interface/stores/monitoring/monitoringStore';
import { SystemMetricsEvent } from '@workspace/typescript-interface/monitoring/system.metrics';
import { formatBytes } from '@/utils/formatBytes';

const defaultValue: Omit<
    MonitoringState,
    'connect' | 'disconnect' | 'reconnect' | 'setError' | 'clearMetrics' | 'exportMetrics'
> = {
    metrics: null,
    isLoading: false,
    isConnected: false,
    error: null,
    lastUpdate: null,
    eventSource: null,
    connectionState: 'disconnected',
    history: [],
    maxHistorySize: 60,
};

let lastConnectionParams: MonitoringStateParams | null = null;

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
    ...defaultValue,

    connect: ({ refreshRate }) => {
        const state = get();

        if (state.isConnected) {
            return;
        }

        lastConnectionParams = { refreshRate };

        set({
            isLoading: true,
            connectionState: 'connecting',
            error: null,
        });

        const unsubscribers: (() => void)[] = [];

        try {
            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'monitoring',
                    'initial-state',
                    (e) => {
                        try {
                            const event: SystemMetricsEvent = JSON.parse(e.data);

                            set({
                                metrics: event.metrics || null,
                                lastUpdate: Date.now(),
                                isLoading: false,
                                isConnected: true,
                                connectionState: 'connected',
                                history: event.metrics ? [event.metrics] : [],
                            });
                        } catch (err) {
                            console.error('[Monitoring] Error parsing initial state:', err);
                        }
                    },
                    { refreshRate },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'monitoring',
                    'metrics-update',
                    (e) => {
                        try {
                            const event: SystemMetricsEvent = JSON.parse(e.data);
                            const state = get();

                            if (!event.metrics) return;

                            const newHistory = [...state.history, event.metrics];

                            if (newHistory.length > state.maxHistorySize) {
                                newHistory.shift();
                            }

                            set({
                                metrics: event.metrics,
                                lastUpdate: Date.now(),
                                isLoading: false,
                                isConnected: true,
                                connectionState: 'connected',
                                history: newHistory,
                            });
                        } catch (err) {
                            console.error('[Monitoring] Error parsing metrics update:', err);
                        }
                    },
                    { refreshRate },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'monitoring',
                    'error',
                    (e: MessageEvent) => {
                        try {
                            const event: SystemMetricsEvent = JSON.parse(e.data);
                            set({
                                error: new Error(event.error || 'Unknown error'),
                                isLoading: false,
                                connectionState: 'error',
                            });
                        } catch (e) {
                            console.error('[Monitoring] SSE error event:', e);
                        }
                    },
                    { refreshRate },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'monitoring',
                    'heartbeat',
                    () => {
                        set({ lastUpdate: Date.now() });
                    },
                    { refreshRate },
                ),
            );

            set({
                eventSource: {
                    close: () => {
                        unsubscribers.forEach((fn) => fn());
                    },
                } as EventSource,
            });
        } catch (err) {
            console.error('[Monitoring] Error connecting to metrics stream:', err);
            set({
                error: err as Error,
                isLoading: false,
                isConnected: false,
                connectionState: 'error',
            });
        }
    },

    disconnect: () => {
        const state = get();

        if (state.eventSource) {
            state.eventSource.close();
        }

        set(defaultValue);
    },

    reconnect: () => {
        const state = get();
        if (!lastConnectionParams) return;

        if (state.isConnected) {
            state.disconnect();
        }

        setTimeout(() => {
            const { refreshRate } = lastConnectionParams!;
            get().connect({ refreshRate });
        }, 100);
    },

    setError: (error: Error | null) => {
        set({ error });
    },

    clearMetrics: () => {
        set({
            metrics: null,
            history: [],
        });
    },

    exportMetrics: () => {
        const { history } = get();

        if (history.length === 0) {
            console.warn('[Monitoring] No metrics to export');
            return;
        }

        const headers = [
            'timestamp',
            'cpuPercent',
            'memoryPercent',
            'diskPercent',
            'memoryUsed',
            'memoryTotal',
            'diskUsed',
            'diskTotal',
        ];

        const rows = history.map((metric) => [
            dayjs(metric.timestamp).toISOString(),
            `${metric.cpuPercent.toFixed(2)}%`,
            `${metric.memoryPercent.toFixed(2)}%`,
            `${metric.diskPercent.toFixed(2)}%`,
            formatBytes(metric.memoryUsed),
            formatBytes(metric.memoryTotal),
            formatBytes(metric.diskUsed),
            formatBytes(metric.diskTotal),
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-metrics-${dayjs().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
}));
