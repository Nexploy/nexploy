import type { Metadata } from 'next';
import { VolumeDetailPage } from '@/components/docker/volume/VolumeDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';
import { kyDocker } from '@/lib/api/kyDocker';
import { notFound } from 'next/navigation';

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

    try {
        await kyDocker.get(`volumes/${decodedName}/inspect`).json();
    } catch {
        notFound();
    }

    return (
        <SSEProvider connections={['volumes']}>
            <VolumeDetailPage volumeName={decodedName} />
        </SSEProvider>
    );
}
