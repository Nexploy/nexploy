import type { Metadata } from 'next';
import { VolumeDetailPage } from '@/components/docker/volume/VolumeDetailPage';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';
import { kyDocker } from '@/lib/api/kyDocker';
import { notFound } from 'next/navigation';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';

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
        await kyDocker.get(`volumes/${decodedName}/inspect`).json<Volume>();
    } catch {
        notFound();
    }

    return (
        <BreadcrumbProvider segments={{ volumeName }}>
            <VolumeDetailPage volumeName={volumeName} />
        </BreadcrumbProvider>
    );
}
