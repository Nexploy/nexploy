import { create } from 'zustand';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import type { NodeDetailState } from '@workspace/typescript-interface/stores/docker/nodeDetailStore';
import type { NodeDetailEvent } from '@workspace/typescript-interface/docker/swarm';

const defaultValue = {
    nodeId: null,
    node: null,
    tasks: [],
    notFound: false,
    isConnecting: true,
    isMonitoring: false,
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,
};

export const useSwarmNodeStore = create<NodeDetailState>((set, get) => ({
    ...defaultValue,

    connect: ({ nodeId }) => {
        const state = get();

        if (state.isMonitoring && state.nodeId === nodeId) return;
        if (state.isMonitoring) state.disconnect();
        if (state.reconnectTimeout) clearTimeout(state.reconnectTimeout);

        set({ nodeId, error: null, isConnecting: true, notFound: false });

        const unsubscribers: (() => void)[] = [];

        try {
            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'node',
                    'initial-state',
                    (e) => {
                        const data: NodeDetailEvent = JSON.parse(e.data);
                        set({
                            node: data.node ?? null,
                            tasks: data.tasks ?? [],
                            lastUpdate: data.timestamp,
                            error: null,
                            isMonitoring: true,
                            isConnecting: false,
                            notFound: false,
                        });
                    },
                    { nodeId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'node',
                    'node-updated',
                    (e) => {
                        const data: NodeDetailEvent = JSON.parse(e.data);
                        set({
                            node: data.node ?? get().node,
                            tasks: data.tasks ?? get().tasks,
                            lastUpdate: data.timestamp,
                        });
                    },
                    { nodeId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'node',
                    'node-removed',
                    (e) => {
                        const data: NodeDetailEvent = JSON.parse(e.data);
                        set({ node: null, tasks: [], notFound: true, lastUpdate: data.timestamp });
                    },
                    { nodeId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'node',
                    'not-found',
                    (e) => {
                        const data: NodeDetailEvent = JSON.parse(e.data);
                        set({
                            node: null,
                            tasks: [],
                            notFound: true,
                            isConnecting: false,
                            isMonitoring: true,
                            lastUpdate: data.timestamp,
                        });
                    },
                    { nodeId },
                ),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe(
                    'node',
                    'heartbeat',
                    (e) => {
                        const data = JSON.parse(e.data);
                        set({ lastUpdate: data.timestamp });
                    },
                    { nodeId },
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
        if (state.reconnectTimeout) clearTimeout(state.reconnectTimeout);
        if (state.eventSource) state.eventSource.close();
        set(defaultValue);
    },
}));
