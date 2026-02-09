'use client';

import { use } from 'react';
import { ImageDetailPage } from '@/components/docker/image/ImageDetailPage';
import { useImageStore } from '@/stores/docker/useImageStore';
import { notFound } from 'next/navigation';

export default function ImagePage({ params }: { params: Promise<{ imageId: string }> }) {
    const { imageId } = use(params);
    const image = useImageStore((state) => state.getImage(imageId));

    if (!image) notFound();

    return <ImageDetailPage imageId={imageId} />;
}
