import { DnsProviderType } from 'generated/client';
import { prisma } from '../../../prisma/prisma';
import type { DnsAccountInfo, DnsCredentialValues, DnsRecord, DnsZone } from '@workspace/typescript-interface/dns/dns';
import { getDnsAdapter } from '@/services/dns/core/registry';
import { decryptDnsCredentials, encryptDnsCredentials } from '@/services/dns/core/credentials';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { getUserSession } from '@/services/auth/auth.service.ts';

export async function saveDnsCredential(
    userId: string,
    provider: DnsProviderType,
    displayName: string,
    credentials: DnsCredentialValues,
    serverIp: string,
): Promise<DnsAccountInfo> {
    const t = await getErrorTranslator();
    try {
        await getDnsAdapter(provider).verifyCredentials(credentials);

        const created = await prisma.dnsCredential.create({
            data: {
                userId,
                provider,
                displayName,
                credentials: encryptDnsCredentials(credentials),
                serverIp,
            },
        });

        return {
            id: created.id,
            displayName: created.displayName,
            provider: created.provider,
            serverIp: created.serverIp,
            createdAt: created.createdAt,
        };
    } catch (error) {
        console.error('Failed to save DNS credential:', error);
        throw new Error(t('dns.saveCredentialFailed'));
    }
}

export async function removeDnsCredential(id: string): Promise<void> {
    const t = await getErrorTranslator();
    try {
        await prisma.dnsCredential.delete({ where: { id } });
    } catch (error) {
        console.error('Failed to delete DNS credential:', error);
        throw new Error(t('dns.deleteCredentialFailed'));
    }
}

export async function getDnsAccounts(): Promise<DnsAccountInfo[]> {
    const session = await getUserSession();
    const t = await getErrorTranslator();

    try {
        return await prisma.dnsCredential.findMany({
            where: { userId: session?.user.id },
            select: { id: true, displayName: true, provider: true, serverIp: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
    } catch (error) {
        console.error('Failed to fetch DNS accounts:', error);
        throw new Error(t('dns.fetchAccountsFailed'));
    }
}

async function resolveCredential(credentialId: string) {
    const t = await getErrorTranslator();

    const credential = await prisma.dnsCredential.findUnique({ where: { id: credentialId } });
    if (!credential) throw new Error(t('dns.credentialNotFound'));

    return {
        adapter: getDnsAdapter(credential.provider),
        credentials: decryptDnsCredentials(credential.credentials),
        serverIp: credential.serverIp,
    };
}

export async function listDnsZones(credentialId: string): Promise<DnsZone[]> {
    const t = await getErrorTranslator();
    try {
        const { adapter, credentials } = await resolveCredential(credentialId);
        return await adapter.listZones(credentials);
    } catch (error) {
        console.error('Failed to list DNS zones:', error);
        throw new Error(t('dns.listZonesFailed'));
    }
}

export async function createDnsRecord(
    credentialId: string,
    zoneId: string,
    subdomain: string,
    zoneName: string,
): Promise<DnsRecord> {
    const t = await getErrorTranslator();
    try {
        const { adapter, credentials, serverIp } = await resolveCredential(credentialId);

        return await adapter.createRecord(credentials, {
            zoneId,
            zoneName,
            subdomain: subdomain || '@',
            content: serverIp,
            proxied: adapter.capabilities.supportsProxy,
        });
    } catch (error) {
        console.error('Failed to create DNS record:', error);
        throw new Error(t('dns.createRecordFailed'));
    }
}

export async function updateDnsRecord(
    credentialId: string,
    zoneId: string,
    recordId: string,
    subdomain: string,
    zoneName: string,
): Promise<DnsRecord> {
    const t = await getErrorTranslator();
    try {
        const { adapter, credentials, serverIp } = await resolveCredential(credentialId);

        return await adapter.updateRecord(credentials, recordId, {
            zoneId,
            zoneName,
            subdomain: subdomain || '@',
            content: serverIp,
            proxied: adapter.capabilities.supportsProxy,
        });
    } catch (error) {
        console.error('Failed to update DNS record:', error);
        throw new Error(t('dns.updateRecordFailed'));
    }
}

export async function deleteDnsRecord(credentialId: string, zoneId: string, recordId: string): Promise<void> {
    const t = await getErrorTranslator();
    try {
        const { adapter, credentials } = await resolveCredential(credentialId);
        await adapter.deleteRecord(credentials, zoneId, recordId);
    } catch (error) {
        console.error('Failed to delete DNS record:', error);
        throw new Error(t('dns.deleteRecordFailed'));
    }
}
