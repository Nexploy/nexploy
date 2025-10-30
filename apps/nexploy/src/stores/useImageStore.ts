import { create } from 'zustand';
import { Image, ImageEvent } from '@workspace/typescript-interface/docker.image';
import { toast } from 'sonner';
import { DockerStatusEvent } from '@workspace/typescript-interface/docker.status';

interface ImageState {
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

export const useImageStore = create<ImageState>((set, get) => ({
    images: [],
    error: null,
    lastUpdate: null,
    eventSource: null,
    reconnectTimeout: null,

    setImages: (images) => set({ images }),

    setError: (error) => set({ error }),
    setLastUpdate: (timestamp) => set({ lastUpdate: timestamp }),

    addImage: (image) =>
        set((state) => {
            const newImages = [...state.images, image];

            newImages.sort((a, b) => {
                const nameA = a.name?.[0]?.toLowerCase() || '';
                const nameB = b.name?.[0]?.toLowerCase() || '';
                return nameA.localeCompare(nameB);
            });

            return { images: newImages };
        }),

    removeImage: (imageId) =>
        set((state) => ({
            images: state.images.filter((img) => img.id !== imageId),
        })),

    updateImage: (image) =>
        set((state) => ({
            images: state.images.map((img) => (img.id === image.id ? image : img)),
        })),

    getImage: (id) => {
        return get().images.find((img) => img.id === id);
    },

    getImagesByTag: (tag) => {
        return get().images.filter((img) => img.repoTags?.includes(tag));
    },

    getOrganizedImages: () => {
        const tagged = new Map<string, Image[]>();
        const untagged: Image[] = [];

        get().images.forEach((image) => {
            if (
                image.repoTags &&
                image.repoTags.length > 0 &&
                !image.repoTags.includes('<none>:<none>')
            ) {
                image.repoTags.forEach((tag) => {
                    if (!tagged.has(tag)) {
                        tagged.set(tag, []);
                    }
                    tagged.get(tag)!.push(image);
                });
            } else {
                untagged.push(image);
            }
        });

        return { tagged, untagged };
    },

    connect: (imageIds) => {
        const state = get();

        if (state.eventSource) {
            state.eventSource.close();
        }
        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const url = new URL('/api/events/stream', window.location.origin);

            if (imageIds?.length) url.searchParams.set('images', imageIds.join(','));
            url.searchParams.set('endpoint', '/api/images/events/stream');

            const eventSource = new EventSource(url.toString());

            eventSource.addEventListener('open', () => {
                console.log('SSE Image connection established');
                set({ error: null, eventSource });
            });

            eventSource.addEventListener('initial-state', (e) => {
                const data: ImageEvent = JSON.parse(e.data);
                set({
                    images: data.images || [],
                    lastUpdate: data.timestamp,
                });
            });

            eventSource.addEventListener('heartbeat', (e) => {
                const { timestamp }: DockerStatusEvent = JSON.parse(e.data);
                set({ lastUpdate: timestamp });
            });

            eventSource.addEventListener('state-change', (e) => {
                const data: ImageEvent = JSON.parse(e.data);

                if (data.image) {
                    const images = [...get().images];
                    const index = images.findIndex((img) => img.id === data.image!.id);

                    if (index !== -1) {
                        images[index] = data.image;
                    } else {
                        images.push(data.image);
                    }

                    set({
                        images,
                        lastUpdate: data.timestamp,
                    });
                }
            });

            eventSource.addEventListener('image-added', (e) => {
                const data: ImageEvent = JSON.parse(e.data);
                if (!data.image) return;

                get().addImage(data.image);
                const imageName = data.image.repoTags?.[0] || data.image.id.substring(0, 12);
                toast.success(`Image ${imageName} added`);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('image-updated', (e) => {
                const data: ImageEvent = JSON.parse(e.data);
                const image = data.image;
                if (!image) return;

                const imageName = image.repoTags?.[0] || image.id.substring(0, 12);
                const { action, timestamp } = data;

                get().updateImage(image);

                // if (action) {
                //     toast.success(`Image ${imageName} (action: ${action})`);
                // }

                set({ lastUpdate: timestamp });
            });

            eventSource.addEventListener('image-removed', (e) => {
                const data: ImageEvent = JSON.parse(e.data);
                if (!data.imageId) return;

                get().removeImage(data.imageId);
                const imageName = data.image?.repoTags?.[0] || data.imageId.substring(0, 12);
                toast.success(`Image ${imageName} removed`);
                set({ lastUpdate: data.timestamp });
            });

            eventSource.addEventListener('error', () => {
                const currentEventSource = get().eventSource;

                if (currentEventSource) {
                    currentEventSource.close();
                    set({ eventSource: null });
                }

                set({ error: new Error('Error connecting to Image Docker') });

                const timeout = setTimeout(() => {
                    console.log('Attempting to reconnect...');
                    get().connect(imageIds);
                }, 5000);

                set({ reconnectTimeout: timeout });
            });

            set({ eventSource });
        } catch (err) {
            console.error('Images - Failed to connect :', err);
            set({
                error: err as Error,
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
        });
    },
}));
