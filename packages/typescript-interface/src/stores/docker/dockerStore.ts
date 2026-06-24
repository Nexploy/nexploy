import { DockerStatus } from '../../docker/docker.status';

export interface DockerState {
    status: DockerStatus;
    error: Error | null;
    lastUpdate: number;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;

    setStatus: (status: DockerStatus) => void;

    connect: () => void;
    disconnect: () => void;
    reset: () => void;
}
