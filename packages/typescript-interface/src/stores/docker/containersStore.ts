import { Containers } from '../../docker/docker.containers';

export interface ContainerState {
    containers: Containers[];
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    setContainers: (containers: Containers[]) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;
    addContainer: (container: Containers) => void;
    updateContainer: (container: Containers) => void;
    removeContainer: (containerId: string) => void;

    getContainer: (id: string) => Containers | undefined;
    getContainersByState: (state: Containers['state']) => Containers[];
    getOrganizedContainers: () => {
        stacks: Map<string, Containers[]>;
        standaloneContainers: Containers[];
    };

    connect: (containerIds?: string[]) => void;
    disconnect: () => void;
    reset: () => void;
}
