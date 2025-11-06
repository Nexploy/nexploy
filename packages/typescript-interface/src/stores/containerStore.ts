import { Container } from '../docker/docker.container';

export interface ContainerState {
    containerId: string | null;
    container: Container | null;
    error: Error | null;
    lastUpdate: number | null;
    isMonitoring: boolean;
    isConnecting: boolean;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;

    setContainer: (container: Container | null) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;

    connect: ({ containerId }: { containerId: string }) => void;
    disconnect: () => void;

    isContainerRunning: () => boolean;
    getContainerState: () => Container['state'] | null;
}
