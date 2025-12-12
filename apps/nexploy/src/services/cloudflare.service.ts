import 'server-only';
import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { env } from '../../env';
import {
    CloudflareApiResponse,
    CloudflareCredentialInfo,
    CloudflareDnsRecord,
    CloudflareZone,
} from '@workspace/typescript-interface/cloudflare/cloudflare';
import { drinoCloudflare } from '@/lib/api/drinoCloudflare';
import { tokenCloudflareStorage } from '@/lib/storage/token-cloudlfare-storage';

export async function saveCloudflareCredential(userId: string, apiToken: string): Promise<void> {
    try {
        return await tokenCloudflareStorage.run({ apiToken }, async () => {
            return drinoCloudflare.get<CloudflareZone[]>('/zones').consume({
                result: async () => {
                    const encryptedToken = encrypt(apiToken);

                    await prisma.cloudflareCredential.upsert({
                        where: { userId },
                        update: { apiToken: encryptedToken },
                        create: { userId, apiToken: encryptedToken },
                    });
                },
            });
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error saving credential');
    }
}

export async function removeCloudflareCredential(userId: string): Promise<void> {
    try {
        await prisma.cloudflareCredential.delete({
            where: { userId },
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error deleting credential');
    }
}

export async function getCloudflareCredentialInfo(
    userId: string,
): Promise<CloudflareCredentialInfo> {
    try {
        const credential = await prisma.cloudflareCredential.findUnique({
            where: { userId },
            select: { id: true, createdAt: true },
        });

        return {
            isConnected: !!credential,
            createdAt: credential?.createdAt,
        };
    } catch (error: unknown) {
        throw new Error('Cloudflare not connected');
    }
}

async function getCloudflareApiToken(userId: string): Promise<string> {
    try {
        const credential = await prisma.cloudflareCredential.findUnique({
            where: { userId },
        });

        if (!credential) throw new Error('Cloudflare not connected');

        return decrypt(credential.apiToken);
    } catch (error: unknown) {
        throw new Error('Cloudflare error getting API token');
    }
}

export async function listCloudflareZones(userId: string): Promise<CloudflareZone[]> {
    try {
        const apiToken = await getCloudflareApiToken(userId);

        return await tokenCloudflareStorage.run({ apiToken }, async () => {
            return (
                await drinoCloudflare
                    .get<CloudflareApiResponse<CloudflareZone[]>>('/zones')
                    .consume()
            ).result;
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error listing zones');
    }
}

export async function createCloudflareDnsRecord(
    userId: string,
    zoneId: string,
    subdomain: string,
    zoneName: string,
): Promise<CloudflareDnsRecord> {
    try {
        const apiToken = await getCloudflareApiToken(userId);
        const serverIp = env.SERVER_IP;

        if (!serverIp) {
            throw new Error('SERVER_IP environment variable not configured');
        }

        const fullHostname = subdomain ? `${subdomain}.${zoneName}` : zoneName;

        return await tokenCloudflareStorage.run({ apiToken }, async () => {
            return (
                await drinoCloudflare
                    .post<CloudflareApiResponse<CloudflareDnsRecord>>(
                        `/zones/${zoneId}/dns_records`,
                        {
                            type: 'A',
                            name: fullHostname,
                            content: serverIp,
                            proxied: true,
                            ttl: 1,
                        },
                    )
                    .consume()
            ).result;
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error creating DNS record');
    }
}

export async function deleteCloudflareDnsRecord(
    userId: string,
    zoneId: string,
    dnsRecordId: string,
): Promise<void> {
    try {
        const apiToken = await getCloudflareApiToken(userId);

        await tokenCloudflareStorage.run({ apiToken }, async () => {
            return (
                await drinoCloudflare
                    .delete<
                        CloudflareApiResponse<{ id: string }>
                    >(`/zones/${zoneId}/dns_records/${dnsRecordId}`)
                    .consume()
            ).result;
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare not connected');
    }
}

export async function updateCloudflareDnsRecord(
    userId: string,
    zoneId: string,
    dnsRecordId: string,
    subdomain: string,
    zoneName: string,
): Promise<CloudflareDnsRecord> {
    try {
        const apiToken = await getCloudflareApiToken(userId);
        const serverIp = env.SERVER_IP;

        if (!serverIp) throw new Error('SERVER_IP environment variable not configured');

        const fullHostname = subdomain ? `${subdomain}.${zoneName}` : zoneName;

        return await tokenCloudflareStorage.run({ apiToken }, async () => {
            return (
                await drinoCloudflare
                    .patch<CloudflareApiResponse<CloudflareDnsRecord>>(
                        `/zones/${zoneId}/dns_records/${dnsRecordId}`,
                        {
                            type: 'A',
                            name: fullHostname,
                            content: serverIp,
                            proxied: true,
                            ttl: 1,
                        },
                    )
                    .consume()
            ).result;
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error updating DNS record');
    }
}
