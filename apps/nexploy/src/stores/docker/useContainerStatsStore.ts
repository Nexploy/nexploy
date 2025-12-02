import { create } from 'zustand';
import { sseMultiplexer } from '@/services/docker/SSEMultiplexer';
import {
    ContainerStatsParams,
    ContainerStatsState,
} from '@workspace/typescript-interface/stores/docker/containerStatsStore';
import { ContainerStatsEvent } from '@workspace/typescript-interface/docker/docker.container.stats';
import { formatBytes } from '@/utils/formatBytes';

const defaultValue: Omit<
    ContainerStatsState,
    | 'connect'
    | 'disconnect'
    | 'reconnect'
    | 'setError'
    | 'clearStats'
    | 'exportStats'
    | 'reconnectPreservingData'
> = {
    containerId: null,
    stats: null,
    isLoading: false,
    isConnected: false,
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,
    connectionState: 'disconnected',
    history: [],
    maxHistorySize: 60,
};

let lastConnectionParams: ContainerStatsParams | null = null;

export const useContainerStatsStore = create<ContainerStatsState>((set, get) => ({
    ...defaultValue,

    connect: ({ containerId, refreshRate }) => {
        const state = get();
        const isSameContainerId = state.containerId === containerId;

        if (state.isConnected && isSameContainerId) {
            return;
        }

        if (state.isConnected) {
            state.disconnect();
        }

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        lastConnectionParams = { containerId, refreshRate };

        set({
            containerId,
            isLoading: true,
            connectionState: 'connecting',
            error: null,
            stats: null,
            history: [],
        });

        const unsubscribers: (() => void)[] = [];

        try {
            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'stats',
                    'initial-state',
                    (e) => {
                        try {
                            const event: ContainerStatsEvent = JSON.parse(e.data);

                            set({
                                stats: event.stats,
                                lastUpdate: Date.now(),
                                isLoading: false,
                                isConnected: true,
                                connectionState: 'connected',
                                history: event.stats && [event.stats],
                            });
                        } catch (err) {
                            console.error('[ContainerStats] Error parsing initial state:', err);
                        }
                    },
                    { containerId, refreshRate },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'stats',
                    'stats-update',
                    (e) => {
                        try {
                            const event: ContainerStatsEvent = JSON.parse(e.data);
                            const state = get();

                            const newHistory = [...state.history, event.stats!];

                            if (newHistory.length > state.maxHistorySize) {
                                newHistory.shift();
                            }

                            set({
                                stats: event.stats!,
                                lastUpdate: Date.now(),
                                isLoading: false,
                                isConnected: true,
                                connectionState: 'connected',
                                history: newHistory,
                            });
                        } catch (err) {
                            console.error('[ContainerStats] Error parsing stats update:', err);
                        }
                    },
                    { containerId, refreshRate },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'stats',
                    'removed',
                    (e) => {
                        try {
                            set({
                                error: new Error('Container has been removed'),
                                isLoading: false,
                                isConnected: false,
                                connectionState: 'disconnected',
                            });
                        } catch (err) {
                            console.error('[ContainerStats] Error parsing removed event:', err);
                        }
                    },
                    { containerId, refreshRate },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'stats',
                    'error',
                    (e) => {
                        try {
                            const errorData = JSON.parse(e.data);
                            set({
                                error: new Error(errorData.error || 'Unknown error'),
                                isLoading: false,
                                connectionState: 'error',
                            });
                        } catch {
                            console.error('[ContainerStats] SSE error event:', e);
                        }
                    },
                    { containerId, refreshRate },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'stats',
                    'heartbeat',
                    () => {
                        set({ lastUpdate: Date.now() });
                    },
                    { containerId, refreshRate },
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
            console.error('[ContainerStats] Error connecting to stats stream:', err);
            set({
                error: err as Error,
                isLoading: false,
                isConnected: false,
                connectionState: 'error',
            });
        }
    },

    reconnect: () => {
        const state = get();
        if (!lastConnectionParams) return;

        if (state.isConnected) {
            state.disconnect();
        }

        setTimeout(() => {
            const { containerId, refreshRate } = lastConnectionParams!;
            get().connect({ containerId, refreshRate });
        }, 100);
    },

    reconnectPreservingData: () => {
        if (!lastConnectionParams) {
            console.warn('[ContainerStats] No previous connection params to reconnect');
            return;
        }

        const { containerId, refreshRate } = lastConnectionParams;
        get().connect({ containerId, refreshRate });
    },

    disconnect: () => {
        const state = get();

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        if (state.eventSource) {
            state.eventSource.close();
        }

        set(defaultValue);
    },

    setError: (error: Error | null) => {
        set({ error });
    },

    clearStats: () => {
        set({
            stats: null,
            history: [],
        });
    },

    exportStats: (containerName = 'container') => {
        const { history } = get();

        if (history.length === 0) {
            console.warn('[ContainerStats] No stats to export');
            return;
        }

        const headers = [
            'timestamp',
            'cpuPercent',
            'memoryUsage',
            'memoryLimit',
            'memoryPercent',
            'networkRx',
            'networkTx',
            'blockRead',
            'blockWrite',
            'pidsCount',
        ];

        const rows = history.map((stat) => [
            new Date(stat.timestamp).toISOString(),
            `${stat.cpuPercent.toFixed(3)}%`,
            formatBytes(stat.memoryUsage),
            stat.memoryLimit,
            `${stat.memoryPercent.toFixed(3)}%`,
            formatBytes(stat.networkRx),
            formatBytes(stat.networkTx),
            formatBytes(stat.blockRead),
            formatBytes(stat.blockWrite),
            stat.pidsCount,
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${containerName}-stats-${new Date().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
}));
