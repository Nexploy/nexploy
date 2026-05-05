import { create } from 'zustand';
import { toast } from 'sonner';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { clientT } from '@/lib/i18n/clientTranslations';
import type { SwarmState } from '@workspace/typescript-interface/stores/docker/swarmStore';
import type {
    SwarmEvent,
    SwarmInitialStateEvent,
    SwarmNodeAddedEvent,
    SwarmNodeRemovedEvent,
    SwarmNodeUpdatedEvent,
    SwarmServiceAddedEvent,
    SwarmServiceRemovedEvent,
    SwarmServiceUpdatedEvent,
    SwarmTaskAddedEvent,
    SwarmTaskRemovedEvent,
    SwarmTaskUpdatedEvent,
} from '@workspace/typescript-interface/docker/swarm';

export const useSwarmStore = create<SwarmState>((set, get) => ({
    isSwarmActive: false,
    swarmInfo: null,
    nodes: [],
    services: [],
    tasks: [],
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,

    setIsSwarmActive: (active) => set({ isSwarmActive: active }),
    setSwarmInfo: (info) => set({ swarmInfo: info }),
    setNodes: (nodes) => set({ nodes }),
    setServices: (services) => set({ services }),
    setTasks: (tasks) => set({ tasks }),
    setError: (error) => set({ error }),
    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    addNode: (node) =>
        set((state) => {
            if (state.nodes.find((n) => n.id === node.id)) {
                return state;
            }
            return { nodes: [...state.nodes, node] };
        }),

    updateNode: (node) =>
        set((state) => ({
            nodes: state.nodes.map((n) => (n.id === node.id ? node : n)),
        })),

    removeNode: (nodeId) =>
        set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== nodeId),
        })),

    addService: (service) =>
        set((state) => {
            if (state.services.find((s) => s.id === service.id)) {
                return state;
            }
            return { services: [...state.services, service] };
        }),

    updateService: (service) =>
        set((state) => ({
            services: state.services.map((s) => (s.id === service.id ? service : s)),
        })),

    removeService: (serviceId) =>
        set((state) => ({
            services: state.services.filter((s) => s.id !== serviceId),
        })),

    addTask: (task) =>
        set((state) => {
            if (state.tasks.find((t) => t.id === task.id)) {
                return state;
            }
            return { tasks: [...state.tasks, task] };
        }),

    updateTask: (task) =>
        set((state) => ({
            tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
        })),

    removeTask: (taskId) =>
        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== taskId),
        })),

    getNode: (id) => get().nodes.find((n) => n.id === id),
    getService: (id) => get().services.find((s) => s.id === id),
    getTask: (id) => get().tasks.find((t) => t.id === id),
    getNodesByRole: (role) => get().nodes.filter((n) => n.role === role),
    getActiveNodes: () => get().nodes.filter((n) => n.state === 'ready'),
    getTasksByService: (serviceId) => get().tasks.filter((t) => t.serviceId === serviceId),
    getTasksByNode: (nodeId) => get().tasks.filter((t) => t.nodeId === nodeId),
    getTasksByState: (state) => get().tasks.filter((t) => t.state === state),

    connect: () => {
        const state = get();

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const unsubscribers: (() => void)[] = [];

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'initial-state', (e) => {
                    const data = JSON.parse(e.data) as SwarmEvent;

                    if (data.type === 'not-in-swarm') {
                        set({
                            isSwarmActive: false,
                            swarmInfo: null,
                            nodes: [],
                            services: [],
                            tasks: [],
                            lastUpdate: data.timestamp,
                            error: null,
                        });
                    } else if (data.type === 'initial') {
                        const initialData = data as SwarmInitialStateEvent;
                        set({
                            isSwarmActive: true,
                            swarmInfo: initialData.swarmInfo,
                            nodes: initialData.nodes,
                            services: initialData.services,
                            tasks: initialData.tasks,
                            lastUpdate: data.timestamp,
                            error: null,
                        });
                    }
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'heartbeat', (e) => {
                    const data = JSON.parse(e.data) as SwarmEvent;
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'node-added', (e) => {
                    const data = JSON.parse(e.data) as SwarmNodeAddedEvent;
                    get().addNode(data.node);
                    toast.success(clientT('toasts.nodeJoined', { hostname: data.node.hostname }));
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'node-updated', (e) => {
                    const data = JSON.parse(e.data) as SwarmNodeUpdatedEvent;
                    get().updateNode(data.node);

                    if (data.changes.role) {
                        toast.info(
                            clientT('toasts.nodeRoleChanged', {
                                hostname: data.node.hostname,
                                role: data.changes.role.to,
                            }),
                        );
                    }
                    if (data.changes.availability) {
                        toast.info(
                            clientT('toasts.nodeAvailabilityChanged', {
                                hostname: data.node.hostname,
                                availability: data.changes.availability.to,
                            }),
                        );
                    }
                    if (data.changes.state) {
                        if (data.changes.state.to === 'down') {
                            toast.error(
                                clientT('toasts.nodeDown', { hostname: data.node.hostname }),
                            );
                        } else if (
                            data.changes.state.to === 'ready' &&
                            data.changes.state.from === 'down'
                        ) {
                            toast.success(
                                clientT('toasts.nodeBackOnline', { hostname: data.node.hostname }),
                            );
                        }
                    }

                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'node-removed', (e) => {
                    const data = JSON.parse(e.data) as SwarmNodeRemovedEvent;
                    get().removeNode(data.nodeId);
                    toast.info(
                        clientT('toasts.nodeLeft', { hostname: data.previousNode.hostname }),
                    );
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'service-added', (e) => {
                    const data = JSON.parse(e.data) as SwarmServiceAddedEvent;
                    get().addService(data.service);
                    toast.success(clientT('toasts.serviceCreated', { name: data.service.name }));
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'service-updated', (e) => {
                    const data = JSON.parse(e.data) as SwarmServiceUpdatedEvent;
                    get().updateService(data.service);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'service-removed', (e) => {
                    const data = JSON.parse(e.data) as SwarmServiceRemovedEvent;
                    get().removeService(data.serviceId);
                    toast.info(
                        clientT('toasts.serviceRemoved', { name: data.previousService.name }),
                    );
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'task-added', (e) => {
                    const data = JSON.parse(e.data) as SwarmTaskAddedEvent;
                    get().addTask(data.task);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'task-updated', (e) => {
                    const data = JSON.parse(e.data) as SwarmTaskUpdatedEvent;
                    get().updateTask(data.task);

                    if (data.changes.state?.to === 'failed') {
                        toast.error(
                            clientT('toasts.taskFailed', {
                                id: data.task.id.slice(0, 12),
                                error: data.task.error || 'Unknown error',
                            }),
                        );
                    }

                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('swarm', 'task-removed', (e) => {
                    const data = JSON.parse(e.data) as SwarmTaskRemovedEvent;
                    get().removeTask(data.taskId);
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
