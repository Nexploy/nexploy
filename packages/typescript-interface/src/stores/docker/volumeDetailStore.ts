import { Volume } from '../../docker/docker.volume';

export interface VolumeDetailState {
    volumeName: string | null;
    volume: Volume | null;
    notFound: boolean;
    isConnecting: boolean;
    isMonitoring: boolean;
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    connect: (params: { volumeName: string }) => void;
    disconnect: () => void;
}
