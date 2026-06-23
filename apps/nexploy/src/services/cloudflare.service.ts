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
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export async function saveCloudflareCredential(
    userId: string,
    displayName: string,
    apiToken: string,
    serverIp: string,
): Promise<CloudflareAccountInfo> {
    const t = await getErrorTranslator();
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
        throw new Error(t('cloudflare.saveCredentialFailed'));
    }
}

export async function removeCloudflareCredential(id: string): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.cloudflareCredential.delete({
            where: { id },
        });
    } catch (error: unknown) {
        throw new Error(t('cloudflare.deleteCredentialFailed'));
    }
}

export async function getAllCloudflareAccounts(userId: string): Promise<CloudflareAccountInfo[]> {
    const t = await getErrorTranslator();
    try {
        return await prisma.cloudflareCredential.findMany({
            where: { userId },
            select: { id: true, displayName: true, serverIp: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
    } catch (error: unknown) {
        throw new Error(t('cloudflare.fetchAccountsFailed'));
    }
}

async function getCredentialById(credentialId: string) {
    const t = await getErrorTranslator();
    try {
        const credential = await prisma.cloudflareCredential.findUnique({
            where: { id: credentialId },
        });
        if (!credential) throw new Error(t('cloudflare.credentialNotFound'));
        return credential;
    } catch (error: unknown) {
        throw new Error(t('cloudflare.getCredentialByIdFailed'));
    }
}

export async function listCloudflareZones(credentialId: string): Promise<CloudflareZone[]> {
    const t = await getErrorTranslator();
    try {
        const credential = await getCredentialById(credentialId);
        const apiToken = decrypt(credential.apiToken);

        return await tokenCloudflareStorage.run({ apiToken }, async () => {
            return (await kyCloudflare.get('zones').json<CloudflareApiResponse<CloudflareZone[]>>())
                .result;
        });
    } catch (error: unknown) {
        throw new Error(t('cloudflare.listZonesFailed'));
    }
}

export async function createCloudflareDnsRecord(
    credentialId: string,
    zoneId: string,
    subdomain: string,
    zoneName: string,
): Promise<CloudflareDnsRecord> {
    const t = await getErrorTranslator();
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
        throw new Error(t('cloudflare.createDnsFailed'));
    }
}

export async function deleteCloudflareDnsRecord(
    credentialId: string,
    zoneId: string,
    dnsRecordId: string,
): Promise<void> {
    const t = await getErrorTranslator();
    try {
        const credential = await getCredentialById(credentialId);
        const apiToken = decrypt(credential.apiToken);

        await tokenCloudflareStorage.run({ apiToken }, async () => {
            await kyCloudflare
                .delete(`zones/${zoneId}/dns_records/${dnsRecordId}`)
                .json<CloudflareApiResponse<{ id: string }>>();
        });
    } catch (error: unknown) {
        throw new Error(t('cloudflare.deleteDnsFailed'));
    }
}

export async function updateCloudflareDnsRecord(
    credentialId: string,
    zoneId: string,
    dnsRecordId: string,
    subdomain: string,
    zoneName: string,
): Promise<CloudflareDnsRecord> {
    const t = await getErrorTranslator();
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
        throw new Error(t('cloudflare.updateDnsFailed'));
    }
}
