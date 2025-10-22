import { create } from 'zustand';
import { Container, ContainerEvent } from '@workspace/typescript-interface/docker.container';
import { toast } from 'sonner';

interface ContainerState {
    containers: Map<string, Container>;
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    setContainers: (containers: Map<string, Container>) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;
    addContainer: (container: Container) => void;
    updateContainer: (container: Container) => void;
    removeContainer: (containerId: string) => void;

    getContainer: (id: string) => Container | undefined;
    getContainersByState: (state: Container['state']) => Container[];
    getOrganizedContainers: () => {
        stacks: Map<string, Container[]>;
        standaloneContainers: Container[];
    };

    connect: (containerIds?: string[]) => void;
    disconnect: () => void;
}

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

    connect: (containerIds) => {
        const state = get();

        if (state.eventSource) {
            state.eventSource.close();
        }
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const url = new URL('/api/events/stream', window.location.origin);

            if (containerIds?.length) url.searchParams.set('containers', containerIds.join(','));
            url.searchParams.set('endpoint', '/api/containers/events/stream');

            const eventSource = new EventSource(url.toString());

            eventSource.addEventListener('open', () => {
                console.log('SSE Container connection established');
                set({ error: null, eventSource });
            });

            eventSource.addEventListener('initial-state', (e) => {
                const data: ContainerEvent = JSON.parse(e.data);
                const containers = new Map<string, Container>();

                data.containers?.forEach((container) => {
                    containers.set(container.id, container);
                });

                set({
                    containers,
                    lastUpdate: data.timestamp,
                });
            });

            eventSource.addEventListener('heartbeat', (e) => {
                const { timestamp }: ContainerEvent = JSON.parse(e.data);
                set({ lastUpdate: timestamp });
            });

            eventSource.addEventListener('state-change', (e) => {
                const data: ContainerEvent = JSON.parse(e.data);
                const containers = new Map(get().containers);

                if (data.container) containers.set(data.container.id, data.container);

                set({
                    containers,
                    lastUpdate: data.timestamp,
                });
            });

            eventSource.addEventListener('container-added', (e) => {
                const data: ContainerEvent = JSON.parse(e.data);
                if (!data.container) return;

                get().addContainer(data.container);
                toast.success(`Container ${data.container.name} added`);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('container-updated', (e) => {
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
            });

            eventSource.addEventListener('container-removed', (e) => {
                const data: ContainerEvent = JSON.parse(e.data);
                if (!data.containerId) return;

                get().removeContainer(data.containerId);
                toast.success(`Container ${data.container?.name} removed`);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('error', () => {
                const currentEventSource = get().eventSource;

                if (currentEventSource) {
                    currentEventSource.close();
                    set({ eventSource: null });
                }

                set({ error: new Error('Error connecting to Container Docker') });

                const timeout = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    get().connect(containerIds);
                }, 5000);

                set({ reconnectTimeout: timeout });
            });

            set({ eventSource });
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
