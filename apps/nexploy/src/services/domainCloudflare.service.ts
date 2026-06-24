import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import {
    createCloudflareDnsRecord,
    deleteCloudflareDnsRecord,
    updateCloudflareDnsRecord,
} from '@/services/cloudflare.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export async function provisionDomainDns(
    domain: Domain,
    host: string,
): Promise<string | undefined> {
    if (!(domain.cloudflareCredentialId && domain.cloudflareZoneId && domain.cloudflareZoneName)) {
        return undefined;
    }

    try {
        const subdomain = extractSubdomain(host, domain.cloudflareZoneName);
        const record = await createCloudflareDnsRecord(
            domain.cloudflareCredentialId,
            domain.cloudflareZoneId,
            subdomain,
            domain.cloudflareZoneName,
        );
        return record.id;
    } catch (error) {
        const t = await getErrorTranslator();
        throw new Error(t('domain.createDnsFailed', { host, error: String(error) }));
    }
}

export async function syncDomainDns(
    domain: Domain,
    original: Domain,
    host: string,
): Promise<string | undefined> {
    const credentialId = domain.cloudflareCredentialId ?? original.cloudflareCredentialId;
    if (!credentialId) {
        return domain.cloudflareDnsRecordId;
    }

    const t = await getErrorTranslator();
    const wasCloudflare = !!original.cloudflareZoneId;
    const isCloudflare = !!domain.cloudflareZoneId;
    const zoneChanged =
        wasCloudflare && isCloudflare && original.cloudflareZoneId !== domain.cloudflareZoneId;
    const hostChanged = original.host !== host;

    if (wasCloudflare && !isCloudflare && original.cloudflareDnsRecordId) {
        try {
            await deleteCloudflareDnsRecord(
                credentialId,
                original.cloudflareZoneId!,
                original.cloudflareDnsRecordId,
            );
        } catch (error) {
            console.error('Failed to delete Cloudflare DNS:', error);
        }
        return undefined;
    }

    if (!wasCloudflare && isCloudflare && domain.cloudflareZoneId && domain.cloudflareZoneName) {
        try {
            const subdomain = extractSubdomain(host, domain.cloudflareZoneName);
            const record = await createCloudflareDnsRecord(
                credentialId,
                domain.cloudflareZoneId,
                subdomain,
                domain.cloudflareZoneName,
            );
            return record.id;
        } catch (error) {
            throw new Error(t('domain.createDnsFailed', { host, error: String(error) }));
        }
    }

    if (zoneChanged && domain.cloudflareZoneId && domain.cloudflareZoneName) {
        if (original.cloudflareDnsRecordId) {
            try {
                await deleteCloudflareDnsRecord(
                    credentialId,
                    original.cloudflareZoneId!,
                    original.cloudflareDnsRecordId,
                );
            } catch (error) {
                console.error('Failed to delete old DNS:', error);
            }
        }
        try {
            const subdomain = extractSubdomain(host, domain.cloudflareZoneName);
            const record = await createCloudflareDnsRecord(
                credentialId,
                domain.cloudflareZoneId,
                subdomain,
                domain.cloudflareZoneName,
            );
            return record.id;
        } catch (error) {
            throw new Error(t('domain.createDnsFailed', { host, error: String(error) }));
        }
    }

    if (
        hostChanged &&
        isCloudflare &&
        domain.cloudflareZoneId &&
        domain.cloudflareZoneName &&
        domain.cloudflareDnsRecordId
    ) {
        try {
            const subdomain = extractSubdomain(host, domain.cloudflareZoneName);
            await updateCloudflareDnsRecord(
                credentialId,
                domain.cloudflareZoneId,
                domain.cloudflareDnsRecordId,
                subdomain,
                domain.cloudflareZoneName,
            );
        } catch (error) {
            throw new Error(t('domain.updateDnsFailed', { host, error: String(error) }));
        }
    }

    return domain.cloudflareDnsRecordId;
}

export async function removeDomainDns(domain: Domain): Promise<void> {
    if (
        !(domain.cloudflareCredentialId && domain.cloudflareZoneId && domain.cloudflareDnsRecordId)
    ) {
        return;
    }

    try {
        await deleteCloudflareDnsRecord(
            domain.cloudflareCredentialId,
            domain.cloudflareZoneId,
            domain.cloudflareDnsRecordId,
        );
    } catch (error) {
        throw new Error(`Failed to delete Cloudflare DNS for ${domain.host}`);
    }
}

function extractSubdomain(host: string, zoneName: string): string {
    const cleanHost = host.replace(/^https?:\/\//, '');
    if (cleanHost === zoneName) return '@';
    const subdomain = cleanHost.replace(`.${zoneName}`, '').replace(zoneName, '');
    return subdomain || '@';
}
