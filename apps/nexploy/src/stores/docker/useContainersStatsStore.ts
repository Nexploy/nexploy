import { create } from 'zustand';
import dayjs from 'dayjs';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import {
    ContainersStatsHistoryPoint,
    ContainersStatsParams,
    ContainersStatsState,
} from '@workspace/typescript-interface/stores/docker/containersStatsStore';
import {
    ContainersStatsEvent,
    ContainerStatsSample,
} from '@workspace/typescript-interface/docker/docker.containers.stats';
import { formatBytes } from '@/utils/formatBytes';

const defaultValue: Omit<
    ContainersStatsState,
    'connect' | 'disconnect' | 'reconnect' | 'setError' | 'clearStats' | 'reset' | 'exportStats'
> = {
    stats: [],
    totals: null,
    history: {},
    totalsHistory: [],
    isLoading: false,
    isConnected: false,
    error: null,
    lastUpdate: null,
    eventSource: null,
    connectionState: 'disconnected',
    maxHistorySize: 120,
};

let lastConnectionParams: ContainersStatsParams | null = null;

const toHistoryPoint = (stat: ContainerStatsSample): ContainersStatsHistoryPoint => ({
    timestamp: stat.timestamp,
    cpuPercent: stat.cpuPercent,
    memoryUsage: stat.memoryUsage,
    memoryPercent: stat.memoryPercent,
    networkRxRate: stat.networkRxRate,
    networkTxRate: stat.networkTxRate,
    blockReadRate: stat.blockReadRate,
    blockWriteRate: stat.blockWriteRate,
    pidsCount: stat.pidsCount,
});

const appendHistory = (
    history: ContainersStatsState['history'],
    stats: ContainerStatsSample[],
    maxHistorySize: number,
): ContainersStatsState['history'] => {
    const nextHistory: ContainersStatsState['history'] = {};

    stats.forEach((stat) => {
        const previous = history[stat.containerId] ?? [];
        const points = [...previous, toHistoryPoint(stat)];

        nextHistory[stat.containerId] = points.slice(-maxHistorySize);
    });

    return nextHistory;
};

const applyEvent = (event: ContainersStatsEvent, state: ContainersStatsState) => {
    const totals = event.totals;

    return {
        stats: event.stats,
        totals,
        history: appendHistory(state.history, event.stats, state.maxHistorySize),
        totalsHistory: [
            ...state.totalsHistory,
            {
                timestamp: event.timestamp,
                cpuPercent: totals.cpuPercent,
                memoryUsage: totals.memoryUsage,
                memoryPercent: totals.memoryPercent,
                networkRxRate: totals.networkRxRate,
                networkTxRate: totals.networkTxRate,
                blockReadRate: totals.blockReadRate,
                blockWriteRate: totals.blockWriteRate,
                pidsCount: totals.pidsCount,
                runningCount: totals.runningCount,
                containerCount: totals.containerCount,
            },
        ].slice(-state.maxHistorySize),
        lastUpdate: Date.now(),
        isLoading: false,
        isConnected: true,
        connectionState: 'connected' as const,
    };
};

export const useContainersStatsStore = create<ContainersStatsState>((set, get) => ({
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

        const handleEvent = (e: MessageEvent) => {
            try {
                const event: ContainersStatsEvent = JSON.parse(e.data);
                if (!event.stats) return;

                set(applyEvent(event, get()));
            } catch (err) {
                console.error('[ContainersStats] Error parsing stats event:', err);
            }
        };

        try {
            unsubscribers.push(
                sseMultiplexer.subscribe('containersStats', 'initial-state', handleEvent, {
                    refreshRate,
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containersStats', 'stats-update', handleEvent, {
                    refreshRate,
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'containersStats',
                    'error',
                    (e: MessageEvent) => {
                        try {
                            const event = JSON.parse(e.data);
                            set({
                                error: new Error(event.error || 'Unknown error'),
                                isLoading: false,
                                connectionState: 'error',
                            });
                        } catch {
                            set({
                                error: new Error('Connection lost'),
                                isLoading: false,
                                connectionState: 'error',
                            });
                        }
                    },
                    { refreshRate },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'containersStats',
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
            console.error('[ContainersStats] Error connecting to stats stream:', err);
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
            get().connect(lastConnectionParams!);
        }, 100);
    },

    setError: (error: Error | null) => {
        set({ error });
    },

    clearStats: () => {
        set({ stats: [], totals: null, history: {}, totalsHistory: [] });
    },

    reset: () => {
        set({
            stats: [],
            totals: null,
            history: {},
            totalsHistory: [],
            error: null,
            lastUpdate: null,
            isLoading: true,
            isConnected: false,
            connectionState: 'connecting',
        });
    },

    exportStats: () => {
        const { stats } = get();

        if (stats.length === 0) {
            console.warn('[ContainersStats] No stats to export');
            return;
        }

        const headers = [
            'timestamp',
            'name',
            'state',
            'stack',
            'image',
            'cpuPercent',
            'memoryUsage',
            'memoryLimit',
            'memoryPercent',
            'networkRxRate',
            'networkTxRate',
            'blockReadRate',
            'blockWriteRate',
            'pidsCount',
        ];

        const rows = stats.map((stat) => [
            dayjs(stat.timestamp).toISOString(),
            stat.name,
            stat.state,
            stat.stack ?? '',
            stat.image,
            `${stat.cpuPercent.toFixed(3)}%`,
            formatBytes(stat.memoryUsage),
            formatBytes(stat.memoryLimit),
            `${stat.memoryPercent.toFixed(3)}%`,
            `${formatBytes(stat.networkRxRate)}/s`,
            `${formatBytes(stat.networkTxRate)}/s`,
            `${formatBytes(stat.blockReadRate)}/s`,
            `${formatBytes(stat.blockWriteRate)}/s`,
            stat.pidsCount,
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `containers-metrics-${dayjs().toISOString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
}));
