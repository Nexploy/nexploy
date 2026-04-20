import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import {
    CloudflareAccountInfo,
    CloudflareApiResponse,
    CloudflareDnsRecord,
    CloudflareZone,
} from '@workspace/typescript-interface/cloudflare/cloudflare';
import { kyCloudflare } from '@/lib/api/kyCloudflare';
import { tokenCloudflareStorage } from '@/lib/storage/token-cloudlfare-storage';

export async function saveCloudflareCredential(
    userId: string,
    displayName: string,
    apiToken: string,
    serverIp: string,
): Promise<CloudflareAccountInfo> {
    try {
        return await tokenCloudflareStorage.run({ apiToken }, async () => {
            await kyCloudflare.get('zones').json<CloudflareZone[]>();

            const encryptedToken = encrypt(apiToken);

            const cloudflareCredential = await prisma.cloudflareCredential.create({
                data: { userId, displayName, apiToken: encryptedToken, serverIp },
            });

            return {
                id: cloudflareCredential.id,
                displayName: cloudflareCredential.displayName,
                serverIp: cloudflareCredential.serverIp,
                createdAt: cloudflareCredential.createdAt,
            };
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error saving credential');
    }
}

export async function removeCloudflareCredential(id: string): Promise<void> {
    try {
        await prisma.cloudflareCredential.delete({
            where: { id },
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error deleting credential');
    }
}

export async function getAllCloudflareAccounts(userId: string): Promise<CloudflareAccountInfo[]> {
    try {
        return await prisma.cloudflareCredential.findMany({
            where: { userId },
            select: { id: true, displayName: true, serverIp: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error fetching accounts');
    }
}

async function getCredentialById(credentialId: string) {
    try {
        const credential = await prisma.cloudflareCredential.findUnique({
            where: { id: credentialId },
        });
        if (!credential) throw new Error('Cloudflare credential not found');
        return credential;
    } catch (error: unknown) {
        throw new Error('Cloudflare error getting credential by ID');
    }
}

export async function listCloudflareZones(credentialId: string): Promise<CloudflareZone[]> {
    try {
        const credential = await getCredentialById(credentialId);
        const apiToken = decrypt(credential.apiToken);

        return await tokenCloudflareStorage.run({ apiToken }, async () => {
            return (await kyCloudflare.get('zones').json<CloudflareApiResponse<CloudflareZone[]>>())
                .result;
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error listing zones');
    }
}

export async function createCloudflareDnsRecord(
    credentialId: string,
    zoneId: string,
    subdomain: string,
    zoneName: string,
): Promise<CloudflareDnsRecord> {
    try {
        const credential = await getCredentialById(credentialId);
        const apiToken = decrypt(credential.apiToken);
        const serverIp = credential.serverIp;
        const fullHostname = subdomain && subdomain !== '@' ? `${subdomain}.${zoneName}` : zoneName;

        return await tokenCloudflareStorage.run({ apiToken }, async () => {
            return (
                await kyCloudflare
                    .post(`zones/${zoneId}/dns_records`, {
                        json: {
                            type: 'A',
                            name: fullHostname,
                            content: serverIp,
                            proxied: true,
                            ttl: 1,
                        },
                    })
                    .json<CloudflareApiResponse<CloudflareDnsRecord>>()
            ).result;
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error creating DNS record');
    }
}

export async function deleteCloudflareDnsRecord(
    credentialId: string,
    zoneId: string,
    dnsRecordId: string,
): Promise<void> {
    try {
        const credential = await getCredentialById(credentialId);
        const apiToken = decrypt(credential.apiToken);

        await tokenCloudflareStorage.run({ apiToken }, async () => {
            await kyCloudflare
                .delete(`zones/${zoneId}/dns_records/${dnsRecordId}`)
                .json<CloudflareApiResponse<{ id: string }>>();
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error deleting DNS record');
    }
}

export async function updateCloudflareDnsRecord(
    credentialId: string,
    zoneId: string,
    dnsRecordId: string,
    subdomain: string,
    zoneName: string,
): Promise<CloudflareDnsRecord> {
    try {
        const credential = await getCredentialById(credentialId);
        const apiToken = decrypt(credential.apiToken);
        const serverIp = credential.serverIp;
        const fullHostname = subdomain && subdomain !== '@' ? `${subdomain}.${zoneName}` : zoneName;

        return await tokenCloudflareStorage.run({ apiToken }, async () => {
            return (
                await kyCloudflare
                    .patch(`zones/${zoneId}/dns_records/${dnsRecordId}`, {
                        json: {
                            type: 'A',
                            name: fullHostname,
                            content: serverIp,
                            proxied: true,
                            ttl: 1,
                        },
                    })
                    .json<CloudflareApiResponse<CloudflareDnsRecord>>()
            ).result;
        });
    } catch (error: unknown) {
        throw new Error('Cloudflare error updating DNS record');
    }
}
