import { NetworkDetailPage } from '@/components/docker/network/NetworkDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';

export default async function NetworkPage({ params }: { params: Promise<{ networkId: string }> }) {
    const { networkId } = await params;

    return (
        <SSEProvider connections={['network']} params={{ network: { networkId } }}>
            <NetworkDetailPage networkId={networkId} />
        </SSEProvider>
    );
}
