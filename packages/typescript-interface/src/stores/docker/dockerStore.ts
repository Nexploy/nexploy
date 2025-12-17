import { DockerStatus } from '../../docker/docker.status';

export type EnvironmentStatus = 'connected' | 'disconnected' | 'unknown';

export interface DockerState {
    status: DockerStatus;
    environmentStatus: EnvironmentStatus;
    error: Error | null;
    lastUpdate: number;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;

    setStatus: (status: DockerStatus) => void;
    setEnvironmentStatus: (status: EnvironmentStatus) => void;

    connect: () => void;
    disconnect: () => void;
    reset: () => void;
}
