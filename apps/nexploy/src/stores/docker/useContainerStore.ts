import { create } from 'zustand';
import { Container, ContainerEvent } from '@workspace/typescript-interface/docker/docker.container';
import { toast } from 'sonner';
import { ContainerState } from '@workspace/typescript-interface/stores/containersStore';
import { sseMultiplexer } from '@/services/docker/SSEMultiplexer';

export const useContainerStore = create<ContainerState>((set, get) => ({
    containers: new Map(),
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,

    setContainers: (containers) => set({ containers }),
    setError: (error) => set({ error }),
    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    addContainer: (container) =>
        set((state) => {
            const next = new Map(state.containers);
            next.set(container.id, container);
            return { containers: next };
        }),

    removeContainer: (containerId) =>
        set((state) => {
            const next = new Map(state.containers);
            next.delete(containerId);
            return { containers: next };
        }),

    updateContainer: (container) =>
        set((state) => {
            const next = new Map(state.containers);
            next.set(container.id, container);
            return { containers: next };
        }),

    getContainer: (id) => {
        return get().containers.get(id);
    },

    getContainersByState: (state) => {
        return Array.from(get().containers.values()).filter((c) => c.state === state);
    },

    getOrganizedContainers: () => {
        const stacks = new Map<string, Container[]>();
        const standaloneContainers: Container[] = [];

        Array.from(get().containers.values()).forEach((container) => {
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
                    const data: ContainerEvent = JSON.parse(e.data);
                    const containers = new Map<string, Container>();

                    data.containers?.forEach((container) => {
                        containers.set(container.id, container);
                    });

                    set({
                        containers,
                        lastUpdate: data.timestamp,
                        error: null,
                    });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'heartbeat', (e) => {
                    const { timestamp }: ContainerEvent = JSON.parse(e.data);
                    set({ lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'state-change', (e) => {
                    const data: ContainerEvent = JSON.parse(e.data);
                    const containers = new Map(get().containers);

                    if (data.container) containers.set(data.container.id, data.container);

                    set({
                        containers,
                        lastUpdate: data.timestamp,
                    });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'container-added', (e) => {
                    const data: ContainerEvent = JSON.parse(e.data);
                    if (!data.container) return;

                    get().addContainer(data.container);
                    toast.success(`Container ${data.container.name} added`);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'container-updated', (e) => {
                    const data: ContainerEvent = JSON.parse(e.data);
                    const container = data.container;
                    if (!container) return;

                    const { name } = container;
                    const { action, timestamp } = data;

                    get().updateContainer(container);

                    if (action === 'die') {
                        toast.error(`Container ${name} die unexpectedly`);
                    } else if (action !== 'kill') {
                        toast.success(`Container ${name} (action: ${action})`);
                    }

                    set({ lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('containers', 'container-removed', (e) => {
                    const data: ContainerEvent = JSON.parse(e.data);
                    if (!data.containerId) return;

                    get().removeContainer(data.containerId);
                    toast.success(`Container ${data.oldState?.name} removed`);
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
