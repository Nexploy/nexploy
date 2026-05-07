import type { Metadata } from 'next';
import { VolumeDetailPage } from '@/components/docker/volume/VolumeDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ volumeName: string }>;
}): Promise<Metadata> {
    const { volumeName } = await params;
    return {
        title: `Volume ${decodeURIComponent(volumeName)}`,
        description: `Docker volume details ${decodeURIComponent(volumeName)}`,
    };
}

export default async function VolumePage({ params }: { params: Promise<{ volumeName: string }> }) {
    const { volumeName } = await params;
    const decodedName = decodeURIComponent(volumeName);

    return (
        <SSEProvider connections={['volume']} params={{ volume: { volumeName: decodedName } }}>
            <VolumeDetailPage volumeName={decodedName} />
        </SSEProvider>
    );
}
