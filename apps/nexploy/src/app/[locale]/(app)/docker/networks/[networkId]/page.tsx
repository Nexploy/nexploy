import type { Metadata } from 'next';
import { NetworkDetailPage } from '@/components/docker/network/NetworkDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';
import { kyDocker } from '@/lib/api/kyDocker';
import { notFound } from 'next/navigation';

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

    try {
        await kyDocker.get(`networks/${networkId}`).json();
    } catch {
        notFound();
    }

    return (
        <SSEProvider connections={['networks', 'containers']}>
            <NetworkDetailPage networkId={networkId} />
        </SSEProvider>
    );
}
