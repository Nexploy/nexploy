'use client';

import { useEffect, useState } from 'react';
import { sseMultiplexer } from '@/services/SSEMultiplexer';
import { Image, ImageEvent } from '@workspace/typescript-interface/docker/docker.image';
import { useImagesStore } from '@/stores/docker/useImagesStore.ts';

export function useEnvironmentImages(environmentId?: string): {
    images: Image[];
    isLoading: boolean;
} {
    const globalImages = useImagesStore((s) => s.images);
    const [images, setImages] = useState<Image[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!environmentId) return;

        setIsLoading(true);

        const params = { environment: environmentId };
        const unsubscribers: (() => void)[] = [];

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'images',
                'initial-state',
                (e) => {
                    const data: ImageEvent = JSON.parse(e.data);
                    setImages(data.images || []);
                    setIsLoading(false);
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'images',
                'image-added',
                (e) => {
                    const data: ImageEvent = JSON.parse(e.data);
                    if (!data.image) return;
                    setImages((prev) =>
                        prev.some((img) => img.id === data.image!.id)
                            ? prev
                            : [...prev, data.image!],
                    );
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'images',
                'image-updated',
                (e) => {
                    const data: ImageEvent = JSON.parse(e.data);
                    if (!data.image) return;
                    setImages((prev) =>
                        prev.map((img) => (img.id === data.image!.id ? data.image! : img)),
                    );
                },
                params,
            ),
        );

        unsubscribers.push(
            sseMultiplexer.subscribe(
                'images',
                'image-removed',
                (e) => {
                    const data: ImageEvent = JSON.parse(e.data);
                    if (!data.imageId) return;
                    setImages((prev) => prev.filter((img) => img.id !== data.imageId));
                },
                params,
            ),
        );

        return () => {
            unsubscribers.forEach((fn) => fn());
            setIsLoading(false);
        };
    }, [environmentId]);

    if (!environmentId) {
        return { images: globalImages, isLoading: false };
    }

    return { images, isLoading };
}
