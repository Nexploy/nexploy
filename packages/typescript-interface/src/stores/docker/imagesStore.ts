import { Image } from '../../docker/docker.image';

export interface ImageState {
    images: Image[];
    error: Error | null;
    lastUpdate: number | null;
    eventSource: EventSource | null;
    reconnectTimeout: NodeJS.Timeout | null;
    setImages: (images: Image[]) => void;
    setError: (error: Error | null) => void;
    setLastUpdate: (timestamp: number) => void;
    addImage: (image: Image) => void;
    updateImage: (image: Image) => void;
    removeImage: (imageId: string) => void;

    getImage: (id: string) => Image | undefined;
    getImagesByTag: (tag: string) => Image[];
    getOrganizedImages: () => {
        tagged: Map<string, Image[]>;
        untagged: Image[];
    };

    connect: (imageIds?: string[]) => void;
    disconnect: () => void;
}
