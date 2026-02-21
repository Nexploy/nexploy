import type { Metadata } from 'next';
import { NetworkDetailPage } from '@/components/docker/network/NetworkDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';
import { kyDocker } from '@/lib/api/kyDocker';
import { notFound } from 'next/navigation';
import { NetworkInspectInfo } from 'dockerode';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ networkId: string }>;
}): Promise<Metadata> {
    const { networkId } = await params;
    return {
        title: `Network ${networkId.substring(0, 12)}`,
        description: `Docker network details ${networkId.substring(0, 12)}`,
    };
}

export default async function NetworkPage({ params }: { params: Promise<{ networkId: string }> }) {
    const { networkId } = await params;

    let networkName: string;
    try {
        const network = await kyDocker.get(`networks/${networkId}`).json<NetworkInspectInfo>();
        networkName = network.Name;
    } catch {
        notFound();
    }

    return (
        <BreadcrumbProvider segments={{ networkId: networkName }}>
            <SSEProvider connections={['networks', 'containers']}>
                <NetworkDetailPage networkId={networkId} />
            </SSEProvider>
        </BreadcrumbProvider>
    );
}
