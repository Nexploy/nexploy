import { ServiceDetailPage } from '@/components/swarm/ServiceDetailPage';
import { SSEProvider } from '@/providers/SSEProviders';

export default async function ServicePage({ params }: { params: Promise<{ serviceId: string }> }) {
    const { serviceId } = await params;

    return (
        <SSEProvider connections={['service']} params={{ service: { serviceId } }}>
            <ServiceDetailPage serviceId={serviceId} />
        </SSEProvider>
    );
}
