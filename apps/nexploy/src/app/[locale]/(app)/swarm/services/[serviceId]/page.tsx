import type { Metadata } from 'next';
import { ServiceDetailPage } from '@/components/swarm/ServiceDetailPage';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ serviceId: string }>;
}): Promise<Metadata> {
    const { serviceId } = await params;
    return {
        title: `Service ${serviceId.slice(0, 12)}`,
    };
}

export default async function ServicePage({ params }: { params: Promise<{ serviceId: string }> }) {
    const { serviceId } = await params;
    return <ServiceDetailPage serviceId={serviceId} />;
}
