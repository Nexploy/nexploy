import { Image, ImageHistoryEntry } from '../../docker/docker.image';

export interface ImageDetailState {
    imageId: string | null;
    image: Image | null;
    history: ImageHistoryEntry[];
    notFound: boolean;
    isConnecting: boolean;
    isMonitoring: boolean;
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;

    connect: (params: { imageId: string }) => void;
    disconnect: () => void;
}
