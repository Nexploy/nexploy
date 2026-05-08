import { VolumeDetailPage } from '@/components/docker/volume/VolumeDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';

export default async function VolumePage({ params }: { params: Promise<{ volumeName: string }> }) {
    const { volumeName } = await params;
    const decodedName = decodeURIComponent(volumeName);

    return (
        <SSEProvider connections={['volume']} params={{ volume: { volumeName: decodedName } }}>
            <VolumeDetailPage volumeName={decodedName} />
        </SSEProvider>
    );
}
