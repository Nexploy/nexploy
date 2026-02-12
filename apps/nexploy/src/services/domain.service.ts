import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';
import {
    createCloudflareDnsRecord,
    deleteCloudflareDnsRecord,
    getCloudflareCredentialInfo,
    updateCloudflareDnsRecord,
} from '@/services/cloudflare.service';
import {
    generateTraefikConfigForRepository,
    getDomainsFromTraefikConfig,
} from '@/services/traefik.service';
import { ApplyDomainOperationsInput } from '@workspace/typescript-interface/domain';

export async function applyDomainOperations({
    repositoryId,
    userId,
    operations,
}: ApplyDomainOperationsInput): Promise<Domain[]> {
    const cloudflareInfo = await getCloudflareCredentialInfo(userId);
    const existingDomains = await getDomainsFromTraefikConfig(repositoryId);

    await handleDeletions(operations.delete, cloudflareInfo, userId);

    const editedDomains = await Promise.all(
        operations.edit.map((domain) =>
            handleEdit({
                domain,
                existingDomains,
                cloudflareInfo,
                userId,
            }),
        ),
    );

    const addedDomains = await Promise.all(
        operations.add.map((domain) =>
            handleAdd({
                domain,
                repositoryId,
                cloudflareInfo,
                userId,
            }),
        ),
    );

    const allDomains = [...operations.unchanged, ...editedDomains, ...addedDomains];

    await generateTraefikConfigForRepository(repositoryId, allDomains);

    return allDomains;
}

async function handleDeletions(
    domainsToDelete: Domain[],
    cloudflareInfo: { isConnected: boolean },
    userId: string,
): Promise<void> {
    if (!cloudflareInfo.isConnected) return;

    for (const domain of domainsToDelete) {
        if (domain.cloudflareZoneId && domain.cloudflareDnsRecordId) {
            try {
                await deleteCloudflareDnsRecord(
                    userId,
                    domain.cloudflareZoneId,
                    domain.cloudflareDnsRecordId,
                );
            } catch (error) {
                console.error(`Failed to delete Cloudflare DNS for ${domain.host}:`, error);
            }
        }
    }
}

async function handleEdit({
    domain,
    existingDomains,
    cloudflareInfo,
    userId,
}: {
    domain: Domain;
    existingDomains: Domain[];
    cloudflareInfo: { isConnected: boolean };
    userId: string;
}): Promise<Domain> {
    const originalDomain = existingDomains.find((d) => d.id === domain.id);
    if (!originalDomain) {
        throw new Error(`Original domain not found for ID: ${domain.id}`);
    }

    if (!cloudflareInfo.isConnected) {
        return domain;
    }

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
                userId,
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
                userId,
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
                    userId,
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
                userId,
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
                userId,
                domain.cloudflareZoneId,
                domain.cloudflareDnsRecordId,
                subdomain,
                domain.cloudflareZoneName,
            );
        } catch (error) {
            throw new Error(`Failed to update DNS for ${domain.host}: ${error}`);
        }
    }

    return {
        ...domain,
        cloudflareDnsRecordId: cloudflareDnsRecordId ?? undefined,
    };
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

    return {
        add,
        edit,
        delete: domainsToDelete,
        unchanged,
    };
}

function hasChanges(domain: Domain, original: Domain): boolean {
    const fieldsToCompare: (keyof Domain)[] = [
        'host',
        'path',
        'internalPath',
        'stripPath',
        'containerPort',
        'https',
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
    cloudflareInfo,
    userId,
}: {
    domain: Domain;
    repositoryId: string;
    cloudflareInfo: { isConnected: boolean };
    userId: string;
}): Promise<Domain> {
    let cloudflareDnsRecordId: string | undefined;

    if (cloudflareInfo.isConnected && domain.cloudflareZoneId && domain.cloudflareZoneName) {
        try {
            const subdomain = extractSubdomain(domain.host, domain.cloudflareZoneName);
            const record = await createCloudflareDnsRecord(
                userId,
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

    if (cleanHost === zoneName) {
        return '@';
    }

    const subdomain = cleanHost.replace(`.${zoneName}`, '').replace(zoneName, '');
    return subdomain || '@';
}
