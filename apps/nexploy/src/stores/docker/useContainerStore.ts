import { create } from 'zustand';
import { sseMultiplexer } from '@/services/docker/SSEMultiplexer';
import { ContainerState } from '@workspace/typescript-interface/stores/docker/containerStore';
import { ContainerEvent } from '@workspace/typescript-interface/docker/docker.container';

const defaultValue = {
    containerId: null,
    container: null,
    error: null,
    lastUpdate: null,
    isMonitoring: false,
    isConnecting: false,
    eventSource: null,
    reconnectTimeout: null,
};

export const useContainerStore = create<ContainerState>((set, get) => ({
    ...defaultValue,
    setContainer: (container) => set({ container }),
    setError: (error) => set({ error }),
    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    connect: ({ containerId }) => {
        const state = get();

        if (state.isMonitoring && state.containerId === containerId) {
            return;
        }

        if (state.isMonitoring) {
            state.disconnect();
        }

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        set({
            containerId,
            isConnecting: true,
            error: null,
        });

        const unsubscribers: (() => void)[] = [];

        try {
            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'container',
                    'initial-state',
                    (e) => {
                        const data: ContainerEvent = JSON.parse(e.data);

                        set({
                            container: data.container,
                            lastUpdate: data.timestamp,
                            error: null,
                            isMonitoring: true,
                            isConnecting: false,
                        });
                    },
                    { containerId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'container',
                    'state-change',
                    (e) => {
                        const data: ContainerEvent = JSON.parse(e.data);

                        set({
                            container: data.container,
                            lastUpdate: data.timestamp,
                            error: null,
                        });
                    },
                    { containerId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'container',
                    'removed',
                    (e) => {
                        const data: ContainerEvent = JSON.parse(e.data);

                        set({
                            container: null,
                            lastUpdate: data.timestamp,
                            error: null,
                        });
                    },
                    { containerId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'container',
                    'heartbeat',
                    (e) => {
                        const data: ContainerEvent = JSON.parse(e.data);
                        set({ lastUpdate: data.timestamp });
                    },
                    { containerId },
                ),
            );

            set({
                eventSource: { close: () => unsubscribers.forEach((fn) => fn()) } as EventSource,
            });
        } catch (err) {
            set({
                error: err as Error,
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

        set(defaultValue);
    },

    isContainerRunning: () => {
        const container = get().container;
        return container?.state === 'running';
    },

    getContainerState: () => {
        return get().container?.state || null;
    },
}));
