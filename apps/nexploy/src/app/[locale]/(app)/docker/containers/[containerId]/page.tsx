import { ContainerDetailPage } from '@/components/docker/container/ContainerDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';

export default async function ContainerPage({
    params,
}: {
    params: Promise<{ containerId: string }>;
}) {
    const { containerId } = await params;
    return (
        <SSEProvider connections={['container']} params={{ container: { containerId } }}>
            <ContainerDetailPage />
        </SSEProvider>
    );
}
