import { Volume } from '../../docker/docker.volume';

export interface VolumeState {
    volumes: Volume[];
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;

    setVolumes: (volumes: Volume[]) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;
    addVolume: (volume: Volume) => void;
    removeVolume: (volumeName: string) => void;
    updateVolume: (volume: Volume) => void;
    getVolume: (name: string) => Volume | undefined;

    connect: () => void;
    disconnect: () => void;
}
