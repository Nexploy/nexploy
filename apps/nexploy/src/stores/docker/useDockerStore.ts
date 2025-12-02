import { create } from 'zustand';
import { toast } from 'sonner';
import { DockerStatusEvent } from '@workspace/typescript-interface/docker/docker.status';
import { isToastT } from '@/utils/isToastT';
import { DockerState } from '@workspace/typescript-interface/stores/docker/dockerStore';
import { sseMultiplexer } from '@/services/docker/SSEMultiplexer';

export const useDockerStore = create<DockerState>((set, get) => ({
    status: 'connecting',
    error: null,
    lastUpdate: 0,
    eventSource: null,
    reconnectTimeout: null,

    setStatus: (status) => set({ status }),

    connect: () => {
        const state = get();

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const unsubscribers: (() => void)[] = [];

            unsubscribers.push(
                sseMultiplexer.subscribe('docker', 'initial-state', (e) => {
                    const data: DockerStatusEvent = JSON.parse(e.data);

                    set({
                        status: data.status,
                        lastUpdate: data.timestamp,
                        error: null,
                    });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('docker', 'heartbeat', (e) => {
                    const { timestamp }: DockerStatusEvent = JSON.parse(e.data);
                    set({ lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('docker', 'status-changed', (e) => {
                    const { status, message, timestamp }: DockerStatusEvent = JSON.parse(e.data);

                    if (message?.level) {
                        const toasts = toast.getToasts();
                        const loadingToast = toasts.find(isToastT)?.type === 'loading';

                        if (loadingToast && message?.level === 'loading') return;
                        if (loadingToast) toast.dismiss();

                        toast[message?.level](message.text);
                    }
                    set({ status, lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('docker', 'reconnecting', async (e) => {
                    const reconnectInfo = JSON.parse(e.data);

                    toast.warning(
                        `Reconnecting to Docker service... (Attempt ${reconnectInfo.attempt}/${reconnectInfo.maxAttempts}), ${reconnectInfo.delay}ms`,
                    );

                    set({
                        status: 'connecting',
                        lastUpdate: Date.now(),
                    });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('docker', 'error', () => {
                    set({
                        status: 'disconnected',
                        lastUpdate: Date.now(),
                    });
                }),
            );

            set({
                eventSource: { close: () => unsubscribers.forEach((fn) => fn()) } as EventSource,
                error: null,
            });
        } catch (err) {
            set({
                error: err as Error,
                status: 'error',
                lastUpdate: Date.now(),
            });

            toast.error('Failed to connect to Docker service');
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
