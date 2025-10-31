import { Container } from '../docker/docker.container';

export interface ContainerState {
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
