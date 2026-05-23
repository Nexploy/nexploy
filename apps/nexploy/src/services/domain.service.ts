import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import {
    createCloudflareDnsRecord,
    deleteCloudflareDnsRecord,
    updateCloudflareDnsRecord,
} from '@/services/cloudflare.service';
import {
    generateTraefikConfigForRepository,
    getDomainsFromTraefikConfig,
} from '@/services/traefik.service';
import { ApplyDomainOperationsInput } from '@workspace/typescript-interface/domain';

export async function applyDomainOperations({
    repositoryId,
    operations,
}: ApplyDomainOperationsInput): Promise<Domain[]> {
    const existingDomains = await getDomainsFromTraefikConfig(repositoryId);

    await handleDeletions(operations.delete);

    const editedDomains = await Promise.all(
        operations.edit.map((domain) => handleEdit({ domain, existingDomains })),
    );

    const addedDomains = await Promise.all(
        operations.add.map((domain) => handleAdd({ domain, repositoryId })),
    );

    const allDomains = [...operations.unchanged, ...editedDomains, ...addedDomains];

    await generateTraefikConfigForRepository(repositoryId, allDomains);

    return allDomains;
}

async function handleDeletions(domainsToDelete: Domain[]): Promise<void> {
    await Promise.all(
        domainsToDelete
            .filter(
                (domain) =>
                    domain.cloudflareCredentialId &&
                    domain.cloudflareZoneId &&
                    domain.cloudflareDnsRecordId,
            )
            .map((domain) =>
                deleteCloudflareDnsRecord(
                    domain.cloudflareCredentialId!,
                    domain.cloudflareZoneId!,
                    domain.cloudflareDnsRecordId!,
                ).catch((error) => {
                    console.error(`Failed to delete Cloudflare DNS for ${domain.host}:`, error);
                }),
            ),
    );
}

async function handleEdit({
    domain,
    existingDomains,
}: {
    domain: Domain;
    existingDomains: Domain[];
}): Promise<Domain> {
    const originalDomain = existingDomains.find((d) => d.id === domain.id);
    if (!originalDomain) {
        throw new Error(`Original domain not found for ID: ${domain.id}`);
    }

    const credentialId = domain.cloudflareCredentialId ?? originalDomain.cloudflareCredentialId;
    if (!credentialId) return domain;

    const wasCloudflare = !!originalDomain.cloudflareZoneId;
    const isCloudflare = !!domain.cloudflareZoneId;
    const zoneChanged =
        wasCloudflare &&
        isCloudflare &&
        originalDomain.cloudflareZoneId !== domain.cloudflareZoneId;
    const hostChanged = originalDomain.host !== domain.host;

    let cloudflareDnsRecordId = domain.cloudflareDnsRecordId;

    if (wasCloudflare && !isCloudflare && originalDomain.cloudflareDnsRecordId) {
        try {
            await deleteCloudflareDnsRecord(
                credentialId,
                originalDomain.cloudflareZoneId!,
                originalDomain.cloudflareDnsRecordId,
            );
            cloudflareDnsRecordId = undefined;
        } catch (error) {
            console.error('Failed to delete Cloudflare DNS:', error);
        }
    } else if (
        !wasCloudflare &&
        isCloudflare &&
        domain.cloudflareZoneId &&
        domain.cloudflareZoneName
    ) {
        try {
            const subdomain = extractSubdomain(domain.host, domain.cloudflareZoneName);
            const record = await createCloudflareDnsRecord(
                credentialId,
                domain.cloudflareZoneId,
                subdomain,
                domain.cloudflareZoneName,
            );
            cloudflareDnsRecordId = record.id;
        } catch (error) {
            throw new Error(`Failed to create DNS for ${domain.host}: ${error}`);
        }
    } else if (zoneChanged && domain.cloudflareZoneId && domain.cloudflareZoneName) {
        if (originalDomain.cloudflareDnsRecordId) {
            try {
                await deleteCloudflareDnsRecord(
                    credentialId,
                    originalDomain.cloudflareZoneId!,
                    originalDomain.cloudflareDnsRecordId,
                );
            } catch (error) {
                console.error('Failed to delete old DNS:', error);
            }
        }
        try {
            const subdomain = extractSubdomain(domain.host, domain.cloudflareZoneName);
            const record = await createCloudflareDnsRecord(
                credentialId,
                domain.cloudflareZoneId,
                subdomain,
                domain.cloudflareZoneName,
            );
            cloudflareDnsRecordId = record.id;
        } catch (error) {
            throw new Error(`Failed to create DNS for ${domain.host}: ${error}`);
        }
    } else if (
        hostChanged &&
        isCloudflare &&
        domain.cloudflareZoneId &&
        domain.cloudflareZoneName &&
        domain.cloudflareDnsRecordId
    ) {
        try {
            const subdomain = extractSubdomain(domain.host, domain.cloudflareZoneName);
            await updateCloudflareDnsRecord(
                credentialId,
                domain.cloudflareZoneId,
                domain.cloudflareDnsRecordId,
                subdomain,
                domain.cloudflareZoneName,
            );
        } catch (error) {
            throw new Error(`Failed to update DNS for ${domain.host}: ${error}`);
        }
    }

    return { ...domain, cloudflareDnsRecordId: cloudflareDnsRecordId ?? undefined };
}

export function classifyDomainOperations(
    domains: Domain[],
    existingDomains: Domain[],
    deletedIds: string[],
): { add: Domain[]; edit: Domain[]; delete: Domain[]; unchanged: Domain[] } {
    const add: Domain[] = [];
    const edit: Domain[] = [];
    const unchanged: Domain[] = [];
    const deleteSet = new Set(deletedIds);

    const domainsToDelete = existingDomains.filter((d) => d.id && deleteSet.has(d.id));

    for (const domain of domains) {
        const cleanedDomain = {
            ...domain,
            host: domain.host.replace(/^https?:\/\//, '').replace(/^@\./, ''),
        };

        if (!domain.id) {
            add.push(cleanedDomain);
        } else if (!deleteSet.has(domain.id)) {
            const originalDomain = existingDomains.find((d) => d.id === domain.id);

            if (originalDomain && hasChanges(cleanedDomain, originalDomain)) {
                edit.push(cleanedDomain);
            } else {
                unchanged.push(cleanedDomain);
            }
        }
    }

    return { add, edit, delete: domainsToDelete, unchanged };
}

function hasChanges(domain: Domain, original: Domain): boolean {
    const fieldsToCompare: (keyof Domain)[] = [
        'host',
        'path',
        'internalPath',
        'stripPath',
        'containerPort',
        'https',
        'certificateId',
        'cloudflareZoneId',
        'cloudflareZoneName',
    ];

    return fieldsToCompare.some((field) => {
        const domainValue = domain[field];
        const originalValue = original[field];
        if (domainValue == null && originalValue == null) return false;
        if (domainValue == null || originalValue == null) return true;
        return domainValue !== originalValue;
    });
}

async function handleAdd({
    domain,
    repositoryId,
}: {
    domain: Domain;
    repositoryId: string;
}): Promise<Domain> {
    let cloudflareDnsRecordId: string | undefined;

    if (domain.cloudflareCredentialId && domain.cloudflareZoneId && domain.cloudflareZoneName) {
        try {
            const subdomain = extractSubdomain(domain.host, domain.cloudflareZoneName);
            const record = await createCloudflareDnsRecord(
                domain.cloudflareCredentialId,
                domain.cloudflareZoneId,
                subdomain,
                domain.cloudflareZoneName,
            );
            cloudflareDnsRecordId = record.id;
        } catch (error) {
            throw new Error(`Failed to create DNS for ${domain.host}: ${error}`);
        }
    }

    return {
        ...domain,
        id: `repo-${repositoryId}-${domain.host}`,
        cloudflareDnsRecordId,
    };
}

function extractSubdomain(host: string, zoneName: string): string {
    const cleanHost = host.replace(/^https?:\/\//, '');
    if (cleanHost === zoneName) return '@';
    const subdomain = cleanHost.replace(`.${zoneName}`, '').replace(zoneName, '');
    return subdomain || '@';
}
