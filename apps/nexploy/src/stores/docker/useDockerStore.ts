import { create } from 'zustand';
import { toast } from 'sonner';
import { DockerStatusEvent } from '@workspace/typescript-interface/docker/docker.status';
import { isToastT } from '@/utils/isToastT';
import { DockerState } from '@workspace/typescript-interface/stores/docker/dockerStore';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { clientT } from '@/lib/i18n/clientTranslations';

export const useDockerStore = create<DockerState>((set, get) => ({
    status: 'connecting',
    environmentStatus: 'unknown',
    error: null,
    lastUpdate: 0,
    eventSource: null,
    reconnectTimeout: null,

    setStatus: (status) => set({ status }),
    setEnvironmentStatus: (environmentStatus) => set({ environmentStatus }),

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
                        environmentStatus: 'connected',
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

                        toast[message?.level](clientT(message.key));
                    }
                    set({ status, lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('docker', 'reconnecting', async (e) => {
                    const reconnectInfo = JSON.parse(e.data);

                    toast.warning(
                        clientT('reconnecting', {
                            attempt: reconnectInfo.attempt,
                            maxAttempts: reconnectInfo.maxAttempts,
                            delay: reconnectInfo.delay,
                        }),
                    );

                    set({
                        status: 'connecting',
                        lastUpdate: Date.now(),
                    });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('docker', 'error', (e) => {
                    try {
                        const errorData = JSON.parse(e.data);

                        if (
                            errorData.code === 'ENVIRONMENT_NOT_FOUND' ||
                            errorData.code === 'ENVIRONMENT_UNAVAILABLE'
                        ) {
                            set({
                                environmentStatus: 'disconnected',
                                status: 'error',
                                lastUpdate: Date.now(),
                            });
                        } else {
                            set({
                                status: 'disconnected',
                                lastUpdate: Date.now(),
                            });
                        }
                    } catch (parseError) {
                        set({
                            status: 'disconnected',
                            lastUpdate: Date.now(),
                        });
                    }
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

            toast.error(clientT('toasts.dockerConnectionFailed'));
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

    reset: () => {
        get().disconnect();

        set({
            status: 'connecting',
            environmentStatus: 'unknown',
            error: null,
            lastUpdate: 0,
            eventSource: null,
            reconnectTimeout: null,
        });
    },
}));
