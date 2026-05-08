import { create } from 'zustand';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { NetworkDetailState } from '@workspace/typescript-interface/stores/docker/networkDetailStore';
import { NetworkDetailEvent } from '@workspace/typescript-interface/docker/docker.network';

const defaultValue = {
    networkId: null,
    network: null,
    notFound: false,
    isConnecting: true,
    isMonitoring: false,
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,
};

export const useNetworkStore = create<NetworkDetailState>((set, get) => ({
    ...defaultValue,

    connect: ({ networkId }) => {
        const state = get();

        if (state.isMonitoring && state.networkId === networkId) {
            return;
        }

        if (state.isMonitoring) {
            state.disconnect();
        }

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        set({ networkId, error: null, isConnecting: true, notFound: false });

        const unsubscribers: (() => void)[] = [];

        try {
            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'network',
                    'initial-state',
                    (e) => {
                        const data: NetworkDetailEvent = JSON.parse(e.data);
                        set({
                            network: data.network ?? null,
                            lastUpdate: data.timestamp,
                            error: null,
                            isMonitoring: true,
                            isConnecting: false,
                            notFound: false,
                        });
                    },
                    { networkId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'network',
                    'state-change',
                    (e) => {
                        const data: NetworkDetailEvent = JSON.parse(e.data);
                        set({ network: data.network ?? null, lastUpdate: data.timestamp });
                    },
                    { networkId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'network',
                    'removed',
                    (e) => {
                        const data: NetworkDetailEvent = JSON.parse(e.data);
                        set({ network: null, notFound: true, lastUpdate: data.timestamp });
                    },
                    { networkId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'network',
                    'not-found',
                    (e) => {
                        const data = JSON.parse(e.data);
                        set({
                            network: null,
                            notFound: true,
                            isConnecting: false,
                            isMonitoring: true,
                            lastUpdate: data.timestamp,
                        });
                    },
                    { networkId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'network',
                    'heartbeat',
                    (e) => {
                        const data = JSON.parse(e.data);
                        set({ lastUpdate: data.timestamp });
                    },
                    { networkId },
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
