import { create } from 'zustand';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { ImageDetailState } from '@workspace/typescript-interface/stores/docker/imageDetailStore';
import { ImageDetailEvent } from '@workspace/typescript-interface/docker/docker.image';

const defaultValue = {
    imageId: null,
    image: null,
    history: [],
    notFound: false,
    isConnecting: true,
    isMonitoring: false,
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,
};

export const useImageStore = create<ImageDetailState>((set, get) => ({
    ...defaultValue,

    connect: ({ imageId }) => {
        const state = get();

        if (state.isMonitoring && state.imageId === imageId) {
            return;
        }

        if (state.isMonitoring) {
            state.disconnect();
        }

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        set({ imageId, error: null, isConnecting: true, notFound: false });

        const unsubscribers: (() => void)[] = [];

        try {
            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'image',
                    'initial-state',
                    (e) => {
                        const data: ImageDetailEvent = JSON.parse(e.data);
                        set({
                            image: data.image ?? null,
                            history: data.history ?? [],
                            lastUpdate: data.timestamp,
                            error: null,
                            isMonitoring: true,
                            isConnecting: false,
                            notFound: false,
                        });
                    },
                    { imageId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'image',
                    'state-change',
                    (e) => {
                        const data: ImageDetailEvent = JSON.parse(e.data);
                        set({ image: data.image ?? null, lastUpdate: data.timestamp });
                    },
                    { imageId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'image',
                    'removed',
                    (e) => {
                        const data: ImageDetailEvent = JSON.parse(e.data);
                        set({ image: null, notFound: true, lastUpdate: data.timestamp });
                    },
                    { imageId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'image',
                    'not-found',
                    (e) => {
                        const data = JSON.parse(e.data);
                        set({
                            image: null,
                            notFound: true,
                            isConnecting: false,
                            isMonitoring: true,
                            lastUpdate: data.timestamp,
                        });
                    },
                    { imageId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'image',
                    'heartbeat',
                    (e) => {
                        const data = JSON.parse(e.data);
                        set({ lastUpdate: data.timestamp });
                    },
                    { imageId },
                ),
            );

            set({
                eventSource: { close: () => unsubscribers.forEach((fn) => fn()) } as EventSource,
            });
        } catch (err) {
            set({ error: err as Error });
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

        set(defaultValue);
    },
}));
