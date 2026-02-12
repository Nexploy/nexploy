import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import {
    CloudflareApiResponse,
    CloudflareCredentialInfo,
    CloudflareDnsRecord,
    CloudflareZone,
} from '@workspace/typescript-interface/cloudflare/cloudflare';
import { drinoCloudflare } from '@/lib/api/drinoCloudflare';
import { tokenCloudflareStorage } from '@/lib/storage/token-cloudlfare-storage';

export async function saveCloudflareCredential(
    userId: string,
    apiToken: string,
    serverIp: string,
): Promise<CloudflareCredentialInfo> {
    try {
        return await tokenCloudflareStorage.run({ apiToken }, async () => {
            await drinoCloudflare.get<CloudflareZone[]>('/zones').consume();

            const encryptedToken = encrypt(apiToken);

            const cloudflareCredential = await prisma.cloudflareCredential.create({
                data: { userId, apiToken: encryptedToken, serverIp },
            });

            return {
                isConnected: true,
                createdAt: cloudflareCredential.createdAt,
            };
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

async function getServerIp(userId: string): Promise<string> {
    try {
        const credential = await prisma.cloudflareCredential.findUnique({
            where: { userId },
            select: { serverIp: true },
        });

        if (!credential) throw new Error('Cloudflare not connected');

        return credential.serverIp;
    } catch (error: unknown) {
        throw new Error('Cloudflare error getting server IP');
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
        const serverIp = await getServerIp(userId);

        const fullHostname = subdomain && subdomain !== '@' ? `${subdomain}.${zoneName}` : zoneName;

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
        const serverIp = await getServerIp(userId);

        const fullHostname = subdomain && subdomain !== '@' ? `${subdomain}.${zoneName}` : zoneName;

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
