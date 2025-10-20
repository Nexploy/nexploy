import { create } from 'zustand';
import { toast } from 'sonner';
import { DockerStatus, DockerStatusEvent } from '@workspace/typescript-interface/docker.status';
import { isToastT } from '@/utils/isToastT';

interface ContainerState {
    status: DockerStatus;
    error: Error | null;
    lastUpdate: number;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;

    setStatus: (status: DockerStatus) => void;

    connect: () => void;
    disconnect: () => void;
}

export const useDockerStore = create<ContainerState>((set, get) => ({
    status: 'connecting',
    error: null,
    lastUpdate: 0,
    eventSource: null,
    reconnectTimeout: null,

    setStatus: (status) => set({ status }),

    connect: () => {
        const state = get();

        if (state.eventSource) {
            state.eventSource.close();
        }
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const url = new URL('/api/events/stream', window.location.origin);

            url.searchParams.set('endpoint', '/api/docker/events/stream');

            const eventSource = new EventSource(url.toString());

            eventSource.addEventListener('open', () => {
                console.log('SSE Docker connection established');
                set({ error: null, eventSource });
            });

            eventSource.addEventListener('initial-state', (e) => {
                const data: DockerStatusEvent = JSON.parse(e.data);

                set({
                    status: data.status,
                    lastUpdate: data.timestamp,
                });
            });

            eventSource.addEventListener('heartbeat', (e) => {
                const { timestamp }: DockerStatusEvent = JSON.parse(e.data);
                set({ lastUpdate: timestamp });
            });

            eventSource.addEventListener('status-changed', (e) => {
                const { status, message, timestamp }: DockerStatusEvent = JSON.parse(e.data);

                if (message?.level) {
                    const toasts = toast.getToasts();
                    const loadingToast = toasts.find(isToastT)?.type === 'loading';

                    if (loadingToast && message?.level === 'loading') return;
                    if (loadingToast) toast.dismiss();

                    toast[message?.level](message.text);
                }
                set({ status, lastUpdate: timestamp });
            });

            eventSource.addEventListener('error', () => {
                const currentEventSource = get().eventSource;

                if (currentEventSource) {
                    currentEventSource.close();
                    set({ status: 'error', eventSource: null });
                }

                set({ error: new Error('Connection lost, reconnecting...') });

                const timeout = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    get().connect();
                }, 5000);

                set({ reconnectTimeout: timeout });
            });

            set({ eventSource });
        } catch (err) {
            console.error('Failed to connect:', err);
            set({
                error: err as Error,
                status: 'error',
            });
        }
    },

    disconnect: () => {
        const state = get();

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        if (state.eventSource) {
            state.eventSource.close();
        }

        set({
            eventSource: null,
            reconnectTimeout: null,
            status: 'disconnected',
        });
    },
}));
