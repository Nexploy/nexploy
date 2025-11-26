import { create } from 'zustand';

export interface BuildLogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    step: string;
    message: string;
}

export type BuildStatus = 'pending' | 'cloning' | 'building' | 'deploying' | 'completed' | 'failed';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface BuildLogsState {
    jobId: string | null;
    deploymentId: string | null;
    logs: BuildLogEntry[];
    status: BuildStatus | null;
    isLoading: boolean;
    isConnected: boolean;
    error: Error | null;
    connectionState: ConnectionState;
    eventSource: EventSource | null;
    autoScroll: boolean;
    messageEnd: string | undefined;

    connect: (params: { jobId: string; deploymentId?: string }) => void;
    disconnect: () => void;
    setAutoScroll: (autoScroll: boolean) => void;
    downloadLogs: (name?: string) => void;
}

const DOCKER_API_URL = 'http://localhost:3300';

export const useBuildLogsStore = create<BuildLogsState>((set, get) => ({
    jobId: null,
    deploymentId: null,
    logs: [],
    status: null,
    isLoading: false,
    isConnected: false,
    error: null,
    connectionState: 'disconnected',
    eventSource: null,
    autoScroll: true,
    messageEnd: undefined,

    connect: ({ jobId, deploymentId }) => {
        const state = get();

        if (state.isConnected && state.jobId === jobId) {
            return;
        }

        if (state.eventSource) {
            state.eventSource.close();
        }

        set({
            jobId,
            deploymentId: deploymentId || null,
            logs: [],
            status: null,
            isLoading: true,
            error: null,
            connectionState: 'connecting',
            messageEnd: undefined,
        });

        try {
            const eventSource = new EventSource(`${DOCKER_API_URL}/api/build/events/logs/${jobId}`);

            eventSource.addEventListener('initial', (e) => {
                try {
                    const data = JSON.parse(e.data);
                    set({
                        logs: data.logs || [],
                        status: data.status,
                        isLoading: false,
                        isConnected: true,
                        connectionState: 'connected',
                    });
                } catch (err) {
                    console.error('[BuildLogs] Error parsing initial state:', err);
                }
            });

            eventSource.addEventListener('log', (e) => {
                try {
                    const data = JSON.parse(e.data);
                    set((state) => ({
                        logs: [...state.logs, data.log],
                        status: data.status,
                    }));
                } catch (err) {
                    console.error('[BuildLogs] Error parsing log:', err);
                }
            });

            eventSource.addEventListener('status-change', (e) => {
                try {
                    const data = JSON.parse(e.data);
                    set({ status: data.status });
                } catch (err) {
                    console.error('[BuildLogs] Error parsing status-change:', err);
                }
            });

            eventSource.addEventListener('completed', (e) => {
                try {
                    const data = JSON.parse(e.data);
                    const status = data.status;
                    set({
                        status,
                        messageEnd: status === 'completed' ? 'Build completed' : 'Build failed',
                        connectionState: 'disconnected',
                    });
                } catch (err) {
                    console.error('[BuildLogs] Error parsing completed:', err);
                }
            });

            eventSource.addEventListener('error', (e) => {
                if (e instanceof MessageEvent) {
                    try {
                        const data = JSON.parse(e.data);
                        set({
                            error: new Error(data.error || 'Unknown error'),
                            isLoading: false,
                            connectionState: 'error',
                        });
                    } catch {
                        set({
                            error: new Error('Connection error'),
                            isLoading: false,
                            connectionState: 'error',
                        });
                    }
                } else {
                    set({
                        error: new Error('Connection lost'),
                        isLoading: false,
                        connectionState: 'error',
                    });
                }
            });

            eventSource.onerror = () => {
                set({
                    isConnected: false,
                    connectionState: 'error',
                });
            };

            set({ eventSource, isConnected: true });
        } catch (err) {
            set({
                error: err as Error,
                isLoading: false,
                connectionState: 'error',
            });
        }
    },

    disconnect: () => {
        const { eventSource } = get();
        if (eventSource) {
            eventSource.close();
        }
        set({
            jobId: null,
            deploymentId: null,
            logs: [],
            status: null,
            isLoading: false,
            isConnected: false,
            error: null,
            connectionState: 'disconnected',
            eventSource: null,
            messageEnd: undefined,
        });
    },

    setAutoScroll: (autoScroll: boolean) => {
        set({ autoScroll });
    },

    downloadLogs: (name = 'build') => {
        const { logs, deploymentId } = get();

        const logsText = logs
            .map((log) => `[${log.timestamp}] [${log.step}] [${log.level}] ${log.message}`)
            .join('\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}-${deploymentId || 'build'}-logs-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
}));
