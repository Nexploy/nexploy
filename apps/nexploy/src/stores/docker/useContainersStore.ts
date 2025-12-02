import { create } from 'zustand';
import {
    Containers,
    ContainersEvent,
} from '@workspace/typescript-interface/docker/docker.containers';
import { toast } from 'sonner';
import { ContainerState } from '@workspace/typescript-interface/stores/docker/containersStore';
import { sseMultiplexer } from '@/services/docker/SSEMultiplexer';

export const useContainersStore = create<ContainerState>((set, get) => ({
    containers: [],
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,

    setContainers: (containers) => set({ containers }),
    setError: (error) => set({ error }),
    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    addContainer: (container) =>
        set((state) => ({
            containers: [...state.containers, container],
        })),

    removeContainer: (containerId) =>
        set((state) => ({
            containers: state.containers.filter((c) => c.id !== containerId),
        })),

    updateContainer: (container) =>
        set((state) => ({
            containers: state.containers.map((c) => (c.id === container.id ? container : c)),
        })),

    getContainer: (id) => {
        return get().containers.find((c) => c.id === id);
    },

    getContainersByState: (state) => {
        return get().containers.filter((c) => c.state === state);
    },

    getOrganizedContainers: () => {
        const stacks = new Map<string, Containers[]>();
        const standaloneContainers: Containers[] = [];

        get().containers.forEach((container) => {
            const projectLabel = container.labels?.['com.docker.compose.project'];
            if (projectLabel) {
                if (!stacks.has(projectLabel)) {
                    stacks.set(projectLabel, []);
                }
                stacks.get(projectLabel)!.push(container);
            } else {
                standaloneContainers.push(container);
            }
        });

        return { stacks, standaloneContainers };
    },

    connect: () => {
        const state = get();

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const unsubscribers: (() => void)[] = [];

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'initial-state', (e) => {
                    const data: ContainersEvent = JSON.parse(e.data);
                    const containers = data.containers || [];

                    set({
                        containers,
                        lastUpdate: data.timestamp,
                        error: null,
                    });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'heartbeat', (e) => {
                    const { timestamp }: ContainersEvent = JSON.parse(e.data);
                    set({ lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'state-change', (e) => {
                    const data: ContainersEvent = JSON.parse(e.data);

                    if (data.container) {
                        const containers = get().containers.map((c) =>
                            c.id === data.container!.id ? data.container! : c,
                        );

                        set({
                            containers,
                            lastUpdate: data.timestamp,
                        });
                    }
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'container-added', (e) => {
                    const data: ContainersEvent = JSON.parse(e.data);
                    if (!data.container) return;

                    get().addContainer(data.container);
                    toast.success(`Container ${data.container.name} added`, {
                        className: 'container-toast',
                    });
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'container-updated', (e) => {
                    const data: ContainersEvent = JSON.parse(e.data);
                    const container = data.container;
                    if (!container) return;

                    const { name } = container;
                    const { action, timestamp } = data;

                    get().updateContainer(container);

                    if (action === 'die') {
                        toast.error(`Container ${name} die unexpectedly`, {
                            className: 'container-toast',
                        });
                    } else {
                        toast.success(`Container ${name} (action: ${action})`, {
                            className: 'container-toast',
                        });
                    }

                    set({ lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'container-removed', (e) => {
                    const data: ContainersEvent = JSON.parse(e.data);
                    if (!data.containerId) return;

                    get().removeContainer(data.containerId);
                    toast.success(`Container ${data.oldState?.name} removed`, {
                        className: 'container-toast',
                    });
                    set({ lastUpdate: data.timestamp });
                }),
            );

            set({
                eventSource: { close: () => unsubscribers.forEach((fn) => fn()) } as EventSource,
            });
        } catch (err) {
            console.error('Containers - Failed to connect :', err);
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

        set({
            eventSource: null,
            reconnectTimeout: null,
        });
    },
}));
