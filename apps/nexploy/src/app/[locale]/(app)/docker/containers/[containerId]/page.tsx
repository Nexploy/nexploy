import type { Metadata } from 'next';
import { ContainerDetailPage } from '@/components/docker/container/ContainerDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { notFound } from 'next/navigation';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ containerId: string }>;
}): Promise<Metadata> {
    const { containerId } = await params;
    return {
        title: `Container ${containerId.substring(0, 12)}`,
        description: `Détails du conteneur Docker ${containerId}`,
    };
}

export default async function ContainerPage({
    params,
}: {
    params: Promise<{ containerId: string }>;
}) {
    const { containerId } = await params;

    try {
        await drinoDocker.get(`/container/${containerId}`).consume();
    } catch {
        notFound();
    }

    return (
        <SSEProvider connections={['container']} params={{ container: { containerId } }}>
            <ContainerDetailPage />;
        </SSEProvider>
    );
}
