import { NodeDetailPage } from '@/components/swarm/NodeDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';

export default async function NodePage({ params }: { params: Promise<{ nodeId: string }> }) {
    const { nodeId } = await params;

    return (
        <SSEProvider connections={['node']} params={{ node: { nodeId } }}>
            <NodeDetailPage nodeId={nodeId} />
        </SSEProvider>
    );
}
