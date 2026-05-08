import { create } from 'zustand';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { VolumeDetailState } from '@workspace/typescript-interface/stores/docker/volumeDetailStore';
import { VolumeDetailEvent } from '@workspace/typescript-interface/docker/docker.volume';

const defaultValue = {
    volumeName: null,
    volume: null,
    notFound: false,
    isConnecting: true,
    isMonitoring: false,
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,
};

export const useVolumeStore = create<VolumeDetailState>((set, get) => ({
    ...defaultValue,

    connect: ({ volumeName }) => {
        const state = get();

        if (state.isMonitoring && state.volume?.name === volumeName) {
            return;
        }

        if (state.isMonitoring) {
            state.disconnect();
        }

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        set({ error: null, isConnecting: true, notFound: false });

        const unsubscribers: (() => void)[] = [];

        try {
            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'volume',
                    'initial-state',
                    (e) => {
                        const data: VolumeDetailEvent = JSON.parse(e.data);
                        set({
                            volume: data.volume ?? null,
                            lastUpdate: data.timestamp,
                            error: null,
                            isMonitoring: true,
                            isConnecting: false,
                            notFound: false,
                        });
                    },
                    { volumeName },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'volume',
                    'state-change',
                    (e) => {
                        const data: VolumeDetailEvent = JSON.parse(e.data);
                        set({ volume: data.volume ?? null, lastUpdate: data.timestamp });
                    },
                    { volumeName },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'volume',
                    'removed',
                    (e) => {
                        const data: VolumeDetailEvent = JSON.parse(e.data);
                        set({ volume: null, notFound: true, lastUpdate: data.timestamp });
                    },
                    { volumeName },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'volume',
                    'not-found',
                    (e) => {
                        const data = JSON.parse(e.data);
                        set({
                            volume: null,
                            notFound: true,
                            isConnecting: false,
                            isMonitoring: true,
                            lastUpdate: data.timestamp,
                        });
                    },
                    { volumeName },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'volume',
                    'heartbeat',
                    (e) => {
                        const data = JSON.parse(e.data);
                        set({ lastUpdate: data.timestamp });
                    },
                    { volumeName },
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
