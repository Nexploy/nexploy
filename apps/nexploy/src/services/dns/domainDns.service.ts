import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { createDnsRecord, deleteDnsRecord, updateDnsRecord } from '@/services/dns/dnsCredential.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { normalizeDomainDnsFields } from '@/services/dns/core/domainDnsFields';

export async function provisionDomainDns(domain: Domain, host: string): Promise<string | undefined> {
    const normalized = normalizeDomainDnsFields(domain);

    if (!(normalized.dnsCredentialId && normalized.dnsZoneId && normalized.dnsZoneName)) {
        return undefined;
    }

    try {
        const subdomain = extractSubdomain(host, normalized.dnsZoneName);
        const record = await createDnsRecord(
            normalized.dnsCredentialId,
            normalized.dnsZoneId,
            subdomain,
            normalized.dnsZoneName,
        );
        return record.id;
    } catch (error) {
        const t = await getErrorTranslator();
        throw new Error(t('domain.createDnsFailed', { host, error: String(error) }));
    }
}

export async function syncDomainDns(domain: Domain, original: Domain, host: string): Promise<string | undefined> {
    const next = normalizeDomainDnsFields(domain);
    const previous = normalizeDomainDnsFields(original);

    const credentialId = next.dnsCredentialId ?? previous.dnsCredentialId;
    if (!credentialId) {
        return next.dnsRecordId;
    }

    const t = await getErrorTranslator();
    const wasManaged = !!previous.dnsZoneId;
    const isManaged = !!next.dnsZoneId;
    const zoneChanged = wasManaged && isManaged && previous.dnsZoneId !== next.dnsZoneId;
    const hostChanged = previous.host !== host;

    if (wasManaged && !isManaged && previous.dnsRecordId) {
        try {
            await deleteDnsRecord(credentialId, previous.dnsZoneId!, previous.dnsRecordId);
        } catch (error) {
            console.error('Failed to delete DNS record:', error);
        }
        return undefined;
    }

    if (!wasManaged && isManaged && next.dnsZoneId && next.dnsZoneName) {
        try {
            const subdomain = extractSubdomain(host, next.dnsZoneName);
            const record = await createDnsRecord(credentialId, next.dnsZoneId, subdomain, next.dnsZoneName);
            return record.id;
        } catch (error) {
            throw new Error(t('domain.createDnsFailed', { host, error: String(error) }));
        }
    }

    if (zoneChanged && next.dnsZoneId && next.dnsZoneName) {
        if (previous.dnsRecordId) {
            try {
                await deleteDnsRecord(credentialId, previous.dnsZoneId!, previous.dnsRecordId);
            } catch (error) {
                console.error('Failed to delete old DNS record:', error);
            }
        }
        try {
            const subdomain = extractSubdomain(host, next.dnsZoneName);
            const record = await createDnsRecord(credentialId, next.dnsZoneId, subdomain, next.dnsZoneName);
            return record.id;
        } catch (error) {
            throw new Error(t('domain.createDnsFailed', { host, error: String(error) }));
        }
    }

    if (hostChanged && isManaged && next.dnsZoneId && next.dnsZoneName && next.dnsRecordId) {
        try {
            const subdomain = extractSubdomain(host, next.dnsZoneName);
            await updateDnsRecord(credentialId, next.dnsZoneId, next.dnsRecordId, subdomain, next.dnsZoneName);
        } catch (error) {
            throw new Error(t('domain.updateDnsFailed', { host, error: String(error) }));
        }
    }

    return next.dnsRecordId;
}

export async function removeDomainDns(domain: Domain): Promise<void> {
    const normalized = normalizeDomainDnsFields(domain);

    if (!(normalized.dnsCredentialId && normalized.dnsZoneId && normalized.dnsRecordId)) {
        return;
    }

    try {
        await deleteDnsRecord(normalized.dnsCredentialId, normalized.dnsZoneId, normalized.dnsRecordId);
    } catch {
        throw new Error(`Failed to delete DNS record for ${normalized.host}`);
    }
}

function extractSubdomain(host: string, zoneName: string): string {
    const cleanHost = host.replace(/^https?:\/\//, '');
    if (cleanHost === zoneName) return '@';
    const subdomain = cleanHost.replace(`.${zoneName}`, '').replace(zoneName, '');
    return subdomain || '@';
}
