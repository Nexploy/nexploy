import { create } from 'zustand';
import { Container, ContainerEvent, DockerStatus } from '@workspace/typescript-interface/docker';
import { toast } from 'sonner';

interface ContainerState {
    containers: Map<string, Container>;
    dockerStatus: DockerStatus;
    error: Error | null;
    lastUpdate: number;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;

    setContainers: (containers: Map<string, Container>) => void;
    setDockerStatus: (status: DockerStatus) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;
    addContainer: (container: Container) => void;
    removeContainer: (containerId: string) => void;
    updateContainer: (container: Container) => void;

    getContainer: (id: string) => Container | undefined;
    getContainersByState: (state: Container['state']) => Container[];
    getOrganizedContainers: () => {
        stacks: Map<string, Container[]>;
        standaloneContainers: Container[];
    };

    connect: (apiUrl: string, containerIds?: string[]) => void;
    disconnect: () => void;
}

export const useContainerStore = create<ContainerState>((set, get) => ({
    containers: new Map(),
    dockerStatus: 'connecting',
    error: null,
    lastUpdate: 0,
    eventSource: null,
    reconnectTimeout: null,

    setContainers: (containers) => set({ containers }),
    setDockerStatus: (dockerStatus) => set({ dockerStatus }),
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

    connect: (apiUrl, containerIds) => {
        const state = get();

        if (state.eventSource) {
            state.eventSource.close();
        }
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const url = new URL(`${apiUrl}/stream`, window.location.origin);

            if (containerIds && containerIds.length > 0) {
                url.searchParams.set('containers', containerIds.join(','));
            }

            const eventSource = new EventSource(url.toString());

            eventSource.addEventListener('open', () => {
                console.log('SSE connection established');
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
                    dockerStatus: data.dockerStatus,
                    lastUpdate: data.timestamp,
                });
            });

            eventSource.addEventListener('state-change', (e) => {
                const data: ContainerEvent = JSON.parse(e.data);
                const containers = new Map(get().containers);

                if (data.type === 'removed') {
                    const id = data.containerId;
                    if (id) containers.delete(id);
                } else if (data.container) {
                    containers.set(data.container.id, data.container);
                }

                set({
                    containers: containers,
                    lastUpdate: data.timestamp,
                });
            });

            eventSource.addEventListener('container-added', (e) => {
                const data: ContainerEvent = JSON.parse(e.data);

                if (data.container) {
                    get().addContainer(data.container);
                    set({ lastUpdate: data.timestamp });
                    console.log('Container added:', data.container.name);
                }
            });

            eventSource.addEventListener('container-removed', (e) => {
                const data: ContainerEvent = JSON.parse(e.data);

                if (data.containerId) {
                    get().removeContainer(data.containerId);
                    set({ lastUpdate: data.timestamp });
                    console.log('Container removed:', data.containerId);
                }
            });

            eventSource.addEventListener('heartbeat', (e) => {
                const { dockerStatus }: ContainerEvent = JSON.parse(e.data);
                console.log('Heartbeat received');

                set({ dockerStatus });
            });

            eventSource.addEventListener('docker-status', (e) => {
                const { dockerStatus, message }: ContainerEvent = JSON.parse(e.data);

                toast.success(message);
                set({ dockerStatus });
            });

            eventSource.addEventListener('error', () => {
                const currentEventSource = get().eventSource;

                if (currentEventSource) {
                    currentEventSource.close();
                    set({ dockerStatus: 'error', eventSource: null });
                }

                set({ error: new Error('Connection lost, reconnecting...') });

                const timeout = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    get().connect(apiUrl, containerIds);
                }, 5000);

                set({ reconnectTimeout: timeout });
            });

            set({ eventSource });
        } catch (err) {
            console.error('Failed to connect:', err);
            set({
                error: err as Error,
                dockerStatus: 'error',
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
            dockerStatus: 'disconnected',
        });
    },
}));
