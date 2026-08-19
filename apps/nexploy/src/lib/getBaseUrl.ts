import { headers } from 'next/headers';
import { getInstancePublicUrl } from '@/lib/instance/publicUrl';

export async function getBaseUrl() {
    const configuredUrl = getInstancePublicUrl();
    if (configuredUrl) return configuredUrl;

    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    return `${protocol}://${host}`;
}
