import { ImageDetailPage } from '@/components/docker/image/ImageDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';
import { kyDocker } from '@/lib/api/kyDocker';
import { notFound } from 'next/navigation';

export default async function ImagePage({ params }: { params: Promise<{ imageId: string }> }) {
    const { imageId } = await params;

    try {
        await kyDocker.get(`images/${imageId}`).json();
    } catch {
        notFound();
    }

    return (
        <SSEProvider connections={['images']}>
            <ImageDetailPage imageId={imageId} />;
        </SSEProvider>
    );
}
