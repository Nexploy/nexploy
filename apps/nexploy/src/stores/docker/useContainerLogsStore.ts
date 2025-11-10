import { create } from 'zustand';
import { sseMultiplexer } from '@/services/docker/SSEMultiplexer';
import {
    ContainerLogsEvent,
    LogEntry,
} from '@workspace/typescript-interface/docker/docker.container.logs';
import { ContainerLogsState } from '@workspace/typescript-interface/stores/containerLogsStore';

const defaultValue = {
    containerId: null,
    logs: [],
    isLoading: false,
    isConnected: false,
    error: null,
    lastUpdate: null,
    autoScroll: true,
    eventSource: null,
    reconnectTimeout: null,
    connectionState: 'disconnected' as ContainerLogsState['connectionState'],
};

let logsBuffer: LogEntry[] = [];
let bufferTimeout: NodeJS.Timeout | null = null;
const BUFFER_DELAY = 10;

let lastConnectionParams: { containerId: string; follow: boolean; tail: number } | null = null;

export const useContainerLogsStore = create<ContainerLogsState>((set, get) => ({
    ...defaultValue,

    connect: ({ containerId, follow = true, tail = 50 }) => {
        const state = get();

        if (state.isConnected && state.containerId === containerId) {
            console.log(`[ContainerLogs] Already monitoring logs for container ${containerId}`);
            return;
        }

        if (state.isConnected) {
            state.disconnect();
        }

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        logsBuffer = [];
        if (bufferTimeout) {
            clearTimeout(bufferTimeout);
            bufferTimeout = null;
        }

        lastConnectionParams = { containerId, follow, tail };

        set({
            containerId,
            isLoading: true,
            connectionState: 'connecting',
            messageEnd: undefined,
            error: null,
            logs: [],
        });

        const unsubscribers: (() => void)[] = [];

        const flushBuffer = () => {
            if (logsBuffer.length > 0) {
                get().addLogsBatch([...logsBuffer]);
                logsBuffer = [];
            }
            bufferTimeout = null;
        };

        try {
            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'logs',
                    'log',
                    (e) => {
                        try {
                            const logEntry: ContainerLogsEvent = JSON.parse(e.data);

                            logsBuffer.push(logEntry.log!);

                            if (!bufferTimeout) {
                                bufferTimeout = setTimeout(flushBuffer, BUFFER_DELAY);
                            }

                            set({
                                lastUpdate: Date.now(),
                                messageEnd: undefined,
                                isLoading: false,
                                isConnected: true,
                                connectionState: 'connected',
                            });
                        } catch (err) {
                            console.error('[ContainerLogs] Error parsing log entry:', err);
                        }
                    },
                    { containerId, follow: follow.toString(), tail: tail.toString() },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'logs',
                    'error',
                    (e) => {
                        try {
                            const errorData = JSON.parse(e.data);
                            set({
                                messageEnd: undefined,
                                error: new Error(errorData.error || 'Unknown error'),
                                isLoading: false,
                                connectionState: 'error',
                            });
                        } catch {
                            console.error('[ContainerLogs] SSE error event:', e);
                        }
                    },
                    { containerId, follow: follow.toString(), tail: tail.toString() },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'logs',
                    'end',
                    (e) => {
                        const logEntry: ContainerLogsEvent = JSON.parse(e.data);

                        const messageEndMap = {
                            container_stopped: 'Container stopped',
                            stream_error: 'Stream error',
                            manual_stop: 'Manual stop',
                        };

                        flushBuffer();
                        set({
                            messageEnd: messageEndMap[logEntry.endReason!] || 'Logs stream ended',
                            isLoading: false,
                            isConnected: false,
                            connectionState: 'disconnected',
                        });
                    },
                    { containerId, follow: follow.toString(), tail: tail.toString() },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'logs',
                    'heartbeat',
                    () => {
                        set({ lastUpdate: Date.now() });
                    },
                    { containerId, follow: follow.toString(), tail: tail.toString() },
                ),
            );

            set({
                eventSource: {
                    close: () => {
                        if (bufferTimeout) {
                            clearTimeout(bufferTimeout);
                            flushBuffer();
                        }
                        unsubscribers.forEach((fn) => fn());
                    },
                } as EventSource,
                isConnected: true,
                isLoading: false,
                connectionState: 'connected',
            });
        } catch (err) {
            console.error('[ContainerLogs] Error connecting to logs stream:', err);
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
            const { containerId, follow, tail } = lastConnectionParams!;
            get().connect({ containerId, follow, tail });
        }, 100);
    },

    disconnect: () => {
        const state = get();

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        if (bufferTimeout) {
            clearTimeout(bufferTimeout);
            bufferTimeout = null;
        }

        logsBuffer = [];

        if (state.eventSource) {
            state.eventSource.close();
        }

        set(defaultValue);
    },

    addLog: (log: LogEntry) => {
        set((state) => ({
            logs: [...state.logs, log],
        }));
    },

    addLogsBatch: (newLogs: LogEntry[]) => {
        set((state) => ({
            logs: [...state.logs, ...newLogs],
        }));
    },

    setAutoScroll: (autoScroll: boolean) => {
        set({ autoScroll });
    },

    setError: (error: Error | null) => {
        set({ error });
    },

    downloadLogs: (containerName = 'container') => {
        const { logs } = get();

        const logsText = logs
            .map((log) => `[${log.timestamp}] [${log.stream}] ${log.message}`)
            .join('\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${containerName}-logs-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
}));
