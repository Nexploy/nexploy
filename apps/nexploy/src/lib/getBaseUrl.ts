import { headers } from 'next/headers';

export async function getBaseUrl() {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    return `${protocol}://${host}`;
}
