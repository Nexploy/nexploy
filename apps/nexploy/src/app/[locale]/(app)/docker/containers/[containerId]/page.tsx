import type { Metadata } from 'next';
import { ContainerDetailPage } from '@/components/docker/container/ContainerDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';
import { kyDocker } from '@/lib/api/kyDocker';
import { notFound } from 'next/navigation';
import { Container } from '@workspace/typescript-interface/docker/docker.container';

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

    let containerName: string;
    try {
        const { container } = await kyDocker
            .get(`container/${containerId}`)
            .json<{ container: Container }>();
        containerName = container.name;
    } catch {
        notFound();
    }

    return (
        <SSEProvider connections={['container']} params={{ container: { containerId } }}>
            <BreadcrumbProvider segments={{ containerId: containerName }}>
                <ContainerDetailPage />;
            </BreadcrumbProvider>
        </SSEProvider>
    );
}
