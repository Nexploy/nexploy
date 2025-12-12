import 'server-only';
import { prisma } from '../../prisma/prisma';
import { encrypt, decrypt } from '@/lib/encryption';
import { env } from '../../env';
import type {
    CloudflareZone,
    CloudflareDnsRecord,
    CloudflareApiResponse,
    CloudflareCredentialInfo,
} from '@workspace/typescript-interface/cloudflare/cloudflare';

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

async function cloudflareRequest<T>(
    apiToken: string,
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(`${CLOUDFLARE_API_BASE}${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data: CloudflareApiResponse<T> = await response.json();

    if (!data.success) {
        throw new Error(data.errors[0]?.message || 'Cloudflare API error');
    }

    return data.result;
}

export async function saveCloudflareCredential(
    userId: string,
    apiToken: string,
): Promise<void> {
    // Validate token by fetching zones
    await cloudflareRequest<CloudflareZone[]>(apiToken, '/zones');

    const encryptedToken = encrypt(apiToken);

    await prisma.cloudflareCredential.upsert({
        where: { userId },
        update: { apiToken: encryptedToken },
        create: { userId, apiToken: encryptedToken },
    });
}

export async function removeCloudflareCredential(userId: string): Promise<void> {
    await prisma.cloudflareCredential.delete({
        where: { userId },
    });
}

export async function getCloudflareCredentialInfo(
    userId: string,
): Promise<CloudflareCredentialInfo> {
    const credential = await prisma.cloudflareCredential.findUnique({
        where: { userId },
        select: { id: true, createdAt: true },
    });

    return {
        isConnected: !!credential,
        createdAt: credential?.createdAt,
    };
}

async function getApiToken(userId: string): Promise<string> {
    const credential = await prisma.cloudflareCredential.findUnique({
        where: { userId },
    });

    if (!credential) {
        throw new Error('Cloudflare not connected');
    }

    return decrypt(credential.apiToken);
}

export async function listCloudflareZones(userId: string): Promise<CloudflareZone[]> {
    const apiToken = await getApiToken(userId);
    return cloudflareRequest<CloudflareZone[]>(apiToken, '/zones');
}

export async function createCloudflareDnsRecord(
    userId: string,
    zoneId: string,
    subdomain: string,
    zoneName: string,
): Promise<CloudflareDnsRecord> {
    const apiToken = await getApiToken(userId);
    const serverIp = env.SERVER_IP;

    if (!serverIp) {
        throw new Error('SERVER_IP environment variable not configured');
    }

    const fullHostname = subdomain ? `${subdomain}.${zoneName}` : zoneName;

    return cloudflareRequest<CloudflareDnsRecord>(
        apiToken,
        `/zones/${zoneId}/dns_records`,
        {
            method: 'POST',
            body: JSON.stringify({
                type: 'A',
                name: fullHostname,
                content: serverIp,
                proxied: true,
                ttl: 1, // Auto TTL when proxied
            }),
        },
    );
}

export async function deleteCloudflareDnsRecord(
    userId: string,
    zoneId: string,
    dnsRecordId: string,
): Promise<void> {
    const apiToken = await getApiToken(userId);

    await cloudflareRequest<{ id: string }>(
        apiToken,
        `/zones/${zoneId}/dns_records/${dnsRecordId}`,
        { method: 'DELETE' },
    );
}

export async function updateCloudflareDnsRecord(
    userId: string,
    zoneId: string,
    dnsRecordId: string,
    subdomain: string,
    zoneName: string,
): Promise<CloudflareDnsRecord> {
    const apiToken = await getApiToken(userId);
    const serverIp = env.SERVER_IP;

    if (!serverIp) {
        throw new Error('SERVER_IP environment variable not configured');
    }

    const fullHostname = subdomain ? `${subdomain}.${zoneName}` : zoneName;

    return cloudflareRequest<CloudflareDnsRecord>(
        apiToken,
        `/zones/${zoneId}/dns_records/${dnsRecordId}`,
        {
            method: 'PATCH',
            body: JSON.stringify({
                type: 'A',
                name: fullHostname,
                content: serverIp,
                proxied: true,
                ttl: 1,
            }),
        },
    );
}

export async function listCloudflareDnsRecords(
    userId: string,
    zoneId: string,
): Promise<CloudflareDnsRecord[]> {
    const apiToken = await getApiToken(userId);
    return cloudflareRequest<CloudflareDnsRecord[]>(
        apiToken,
        `/zones/${zoneId}/dns_records?type=A`,
    );
}
