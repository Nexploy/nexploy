import { create } from 'zustand';
import {
    SwarmEvent,
    SwarmNode,
    SwarmService,
} from '@workspace/typescript-interface/docker/docker.swarm';
import { toast } from 'sonner';
import { SwarmState } from '@workspace/typescript-interface/stores/docker/swarmStore';
import { sseMultiplexer } from '@/services/docker/SSEMultiplexer';

export const useSwarmStore = create<SwarmState>((set, get) => ({
    swarmInfo: null,
    nodes: [],
    services: [],
    isSwarmActive: false,
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,

    setSwarmInfo: (info) => set({ swarmInfo: info }),
    setNodes: (nodes) => set({ nodes }),
    setServices: (services) => set({ services }),
    setIsSwarmActive: (active) => set({ isSwarmActive: active }),
    setError: (error) => set({ error }),
    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    addNode: (node) =>
        set((state) => {
            if (state.nodes.find((n) => n.id === node.id)) {
                return state;
            }
            return { nodes: [...state.nodes, node] };
        }),

    removeNode: (nodeId) =>
        set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== nodeId),
        })),

    updateNode: (node) =>
        set((state) => ({
            nodes: state.nodes.map((n) => (n.id === node.id ? node : n)),
        })),

    addService: (service) =>
        set((state) => {
            if (state.services.find((s) => s.id === service.id)) {
                return state;
            }
            return { services: [...state.services, service] };
        }),

    removeService: (serviceId) =>
        set((state) => ({
            services: state.services.filter((s) => s.id !== serviceId),
        })),

    updateService: (service) =>
        set((state) => ({
            services: state.services.map((s) => (s.id === service.id ? service : s)),
        })),

    getNode: (id) => get().nodes.find((n) => n.id === id),

    getService: (id) => get().services.find((s) => s.id === id),

    getNodesByRole: (role) => get().nodes.filter((n) => n.role === role),

    getActiveNodes: () => get().nodes.filter((n) => n.status === 'ready'),

    connect: () => {
        const state = get();

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const unsubscribers: (() => void)[] = [];

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'initial-state', (e) => {
                    const data: SwarmEvent = JSON.parse(e.data);

                    if (data.type === 'not-in-swarm') {
                        set({
                            isSwarmActive: false,
                            swarmInfo: null,
                            nodes: [],
                            services: [],
                            lastUpdate: data.timestamp,
                            error: null,
                        });
                    } else {
                        set({
                            isSwarmActive: true,
                            swarmInfo: data.swarmInfo || null,
                            nodes: data.nodes || [],
                            services: data.services || [],
                            lastUpdate: data.timestamp,
                            error: null,
                        });
                    }
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'heartbeat', (e) => {
                    const { timestamp }: SwarmEvent = JSON.parse(e.data);
                    set({ lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'node-added', (e) => {
                    const data: SwarmEvent = JSON.parse(e.data);
                    if (!data.node) return;

                    get().addNode(data.node);
                    toast.success(`Node ${data.node.hostname} added to swarm`);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'node-updated', (e) => {
                    const data: SwarmEvent = JSON.parse(e.data);
                    if (!data.node) return;

                    get().updateNode(data.node);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'node-removed', (e) => {
                    const data: SwarmEvent = JSON.parse(e.data);
                    if (!data.nodeId) return;

                    const nodeName =
                        (data.oldState as SwarmNode)?.hostname || data.nodeId.substring(0, 12);
                    get().removeNode(data.nodeId);
                    toast.success(`Node ${nodeName} removed from swarm`);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'service-added', (e) => {
                    const data: SwarmEvent = JSON.parse(e.data);
                    if (!data.service) return;

                    get().addService(data.service);
                    toast.success(`Service ${data.service.name} created`);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'service-updated', (e) => {
                    const data: SwarmEvent = JSON.parse(e.data);
                    if (!data.service) return;

                    get().updateService(data.service);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'service-removed', (e) => {
                    const data: SwarmEvent = JSON.parse(e.data);
                    if (!data.serviceId) return;

                    const serviceName =
                        (data.oldState as SwarmService)?.name || data.serviceId.substring(0, 12);
                    get().removeService(data.serviceId);
                    toast.success(`Service ${serviceName} removed`);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            set({
                eventSource: { close: () => unsubscribers.forEach((fn) => fn()) } as EventSource,
            });
        } catch (err) {
            console.error('Swarm - Failed to connect:', err);
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

        set({
            eventSource: null,
            reconnectTimeout: null,
        });
    },
}));
