import { ImageDetailPage } from '@/components/docker/image/ImageDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';

export default async function ImagePage({ params }: { params: Promise<{ imageId: string }> }) {
    const { imageId } = await params;
    return (
        <SSEProvider connections={['image']} params={{ image: { imageId } }}>
            <ImageDetailPage imageId={imageId} />
        </SSEProvider>
    );
}
