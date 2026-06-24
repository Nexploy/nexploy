import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import { generateTraefikConfig, getDomainKey, getDomains } from '@/services/traefik.service';
import { provisionDomainDns, removeDomainDns, syncDomainDns, } from '@/services/domainCloudflare.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export async function createDomain(domain: Domain): Promise<Domain> {
    const existingDomains = await getDomains();
    const host = cleanDomainHost(domain.host);

    const cloudflareDnsRecordId = await provisionDomainDns(domain, host);

    const newDomain: Domain = {
        ...domain,
        host,
        id: getDomainKey({ host }),
        cloudflareDnsRecordId,
    };

    const others = existingDomains.filter((d) => d.id !== newDomain.id);
    await generateTraefikConfig([...others, newDomain]);

    return newDomain;
}

export async function updateDomain(domain: Domain): Promise<Domain> {
    const existingDomains = await getDomains();
    const original = existingDomains.find((d) => d.id === domain.id);

    if (!domain.id || !original) {
        throw new Error((await getErrorTranslator())('domain.notFound'));
    }

    const host = cleanDomainHost(domain.host);
    const cloudflareDnsRecordId = await syncDomainDns(domain, original, host);

    const updatedDomain: Domain = {
        ...domain,
        host,
        cloudflareDnsRecordId: cloudflareDnsRecordId ?? undefined,
    };

    const nextDomains = existingDomains.map((d) => (d.id === domain.id ? updatedDomain : d));
    await generateTraefikConfig(nextDomains);

    return updatedDomain;
}

export async function removeDomain(domainId: string): Promise<void> {
    const existingDomains = await getDomains();
    const domainToDelete = existingDomains.find((d) => d.id === domainId);

    if (!domainToDelete) {
        throw new Error((await getErrorTranslator())('domain.notFound'));
    }

    await removeDomainDns(domainToDelete);
    await generateTraefikConfig(existingDomains.filter((d) => d.id !== domainId));
}

function cleanDomainHost(host: string): string {
    return host.replace(/^https?:\/\//, '').replace(/^@\./, '');
}
