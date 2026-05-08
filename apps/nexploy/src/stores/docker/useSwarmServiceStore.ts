import { create } from 'zustand';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import type { ServiceDetailState } from '@workspace/typescript-interface/stores/docker/serviceDetailStore';
import type { ServiceDetailEvent } from '@workspace/typescript-interface/docker/swarm';

const defaultValue = {
    serviceId: null,
    service: null,
    tasks: [],
    notFound: false,
    isConnecting: true,
    isMonitoring: false,
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,
};

export const useSwarmServiceStore = create<ServiceDetailState>((set, get) => ({
    ...defaultValue,

    connect: ({ serviceId }) => {
        const state = get();

        if (state.isMonitoring && state.serviceId === serviceId) {
            return;
        }

        if (state.isMonitoring) {
            state.disconnect();
        }

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        set({ serviceId, error: null, isConnecting: true, notFound: false });

        const unsubscribers: (() => void)[] = [];

        try {
            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'service',
                    'initial-state',
                    (e) => {
                        const data: ServiceDetailEvent = JSON.parse(e.data);
                        set({
                            service: data.service ?? null,
                            tasks: data.tasks ?? [],
                            lastUpdate: data.timestamp,
                            error: null,
                            isMonitoring: true,
                            isConnecting: false,
                            notFound: false,
                        });
                    },
                    { serviceId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'service',
                    'service-updated',
                    (e) => {
                        const data: ServiceDetailEvent = JSON.parse(e.data);
                        set({
                            service: data.service ?? null,
                            tasks: data.tasks ?? [],
                            lastUpdate: data.timestamp,
                        });
                    },
                    { serviceId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'service',
                    'task-added',
                    (e) => {
                        const data: ServiceDetailEvent = JSON.parse(e.data);
                        set({
                            service: data.service ?? get().service,
                            tasks: data.tasks ?? [],
                            lastUpdate: data.timestamp,
                        });
                    },
                    { serviceId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'service',
                    'task-updated',
                    (e) => {
                        const data: ServiceDetailEvent = JSON.parse(e.data);
                        set({
                            service: data.service ?? get().service,
                            tasks: data.tasks ?? [],
                            lastUpdate: data.timestamp,
                        });
                    },
                    { serviceId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'service',
                    'task-removed',
                    (e) => {
                        const data: ServiceDetailEvent = JSON.parse(e.data);
                        set({
                            service: data.service ?? get().service,
                            tasks: data.tasks ?? [],
                            lastUpdate: data.timestamp,
                        });
                    },
                    { serviceId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'service',
                    'service-removed',
                    (e) => {
                        const data: ServiceDetailEvent = JSON.parse(e.data);
                        set({
                            service: null,
                            tasks: [],
                            notFound: true,
                            lastUpdate: data.timestamp,
                        });
                    },
                    { serviceId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'service',
                    'not-found',
                    (e) => {
                        const data: ServiceDetailEvent = JSON.parse(e.data);
                        set({
                            service: null,
                            tasks: [],
                            notFound: true,
                            isConnecting: false,
                            isMonitoring: true,
                            lastUpdate: data.timestamp,
                        });
                    },
                    { serviceId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'service',
                    'heartbeat',
                    (e) => {
                        const data = JSON.parse(e.data);
                        set({ lastUpdate: data.timestamp });
                    },
                    { serviceId },
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
