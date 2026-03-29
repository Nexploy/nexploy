import { ImageDetailPage } from '@/components/docker/image/ImageDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';
import { kyDocker } from '@/lib/api/kyDocker';
import { notFound } from 'next/navigation';
import { Image } from '@workspace/typescript-interface/docker/docker.image';

export default async function ImagePage({ params }: { params: Promise<{ imageId: string }> }) {
    const { imageId } = await params;

    let imageName: string;
    try {
        const image = await kyDocker.get(`images/${imageId}`).json<Image>();
        imageName = image.name.flat().join('|');
    } catch (e) {
        notFound();
    }

    return (
        <BreadcrumbProvider segments={{ imageId: imageName }}>
            <SSEProvider connections={['images']}>
                <ImageDetailPage imageId={imageId} />;
            </SSEProvider>
        </BreadcrumbProvider>
    );
}
