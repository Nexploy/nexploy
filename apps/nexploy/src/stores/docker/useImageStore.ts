import { create } from 'zustand';
import { Image, ImageEvent } from '@workspace/typescript-interface/docker/docker.image';
import { toast } from 'sonner';
import { DockerStatusEvent } from '@workspace/typescript-interface/docker/docker.status';
import { ImageState } from '@workspace/typescript-interface/stores/imagesStore';
import { sseMultiplexer } from '@/services/docker/SSEMultiplexer';

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

    connect: () => {
        const state = get();

        if (state.reconnectTimeout) {
            clearTimeout(state.reconnectTimeout);
        }

        try {
            const unsubscribers: (() => void)[] = [];

            unsubscribers.push(
                sseMultiplexer.subscribe('images', 'initial-state', (e) => {
                    const data: ImageEvent = JSON.parse(e.data);
                    set({
                        images: data.images || [],
                        lastUpdate: data.timestamp,
                        error: null,
                    });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('images', 'heartbeat', (e) => {
                    const { timestamp }: DockerStatusEvent = JSON.parse(e.data);
                    set({ lastUpdate: timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('images', 'state-change', (e) => {
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
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('images', 'image-added', (e) => {
                    const data: ImageEvent = JSON.parse(e.data);
                    if (!data.image) return;

                    get().addImage(data.image);
                    const imageName = data.image.repoTags?.[0] || data.image.id.substring(0, 12);
                    toast.success(`Image ${imageName} added`);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('images', 'image-updated', (e) => {
                    const data: ImageEvent = JSON.parse(e.data);
                    const image = data.image;
                    if (!image) return;

                    get().updateImage(image);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            unsubscribers.push(
                sseMultiplexer.subscribe('images', 'image-removed', (e) => {
                    const data: ImageEvent = JSON.parse(e.data);
                    if (!data.imageId) return;

                    get().removeImage(data.imageId);
                    const imageName = data.image?.repoTags?.[0] || data.imageId.substring(0, 12);
                    toast.success(`Image ${imageName} removed`);
                    set({ lastUpdate: data.timestamp });
                }),
            );

            set({
                eventSource: { close: () => unsubscribers.forEach((fn) => fn()) } as EventSource,
            });
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
