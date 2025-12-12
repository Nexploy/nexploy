import 'server-only';
import { Domain } from '@workspace/typescript-interface/traefik/traefik.config';
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

interface UpdateRepositoryDomainsInput {
    repositoryId: string;
    userId: string;
    add: Domain[];
    edit: Domain[];
    delete: Domain[];
}

export async function updateRepositoryDomains({
    repositoryId,
    userId,
    add,
    edit,
    delete: deleteDomains,
}: UpdateRepositoryDomainsInput): Promise<Domain[]> {
    const cloudflareInfo = await getCloudflareCredentialInfo(userId);
    const existingDomains = await getDomainsFromTraefikConfig(repositoryId);

    // Clean domains to add (assign IDs and clean host)
    const cleanedAddDomains = add.map((d) => ({
        ...d,
        id: `repo-${repositoryId}-${d.host.replace(/^https?:\/\//, '')}`,
        host: d.host.replace(/^https?:\/\//, ''),
    }));

    // Clean domains to edit (clean host)
    const cleanedEditDomains = edit.map((d) => ({
        ...d,
        host: d.host.replace(/^https?:\/\//, ''),
    }));

    // Handle deletions
    await handleDomainDeletions({
        deleteDomains,
        cloudflareInfo,
        userId,
    });

    // Process edited domains
    const processedEditedDomains = await Promise.all(
        cleanedEditDomains.map((d) =>
            processExistingDomain({
                domain: d,
                originalDomain: existingDomains.find((ed) => ed.id === d.id)!,
                cloudflareInfo,
                userId,
            }),
        ),
    );

    // Process new domains
    const processedNewDomains = await Promise.all(
        cleanedAddDomains.map((d) => processNewDomain({ domain: d, cloudflareInfo, userId })),
    );

    const allDomains = [...processedEditedDomains, ...processedNewDomains];
    await generateTraefikConfigForRepository(repositoryId, allDomains);

    return allDomains;
}

async function handleDomainDeletions({
    deleteDomains,
    cloudflareInfo,
    userId,
}: {
    deleteDomains: Domain[];
    cloudflareInfo: { isConnected: boolean };
    userId: string;
}): Promise<void> {
    if (!cloudflareInfo.isConnected) return;

    for (const domain of deleteDomains) {
        if (domain?.cloudflareZoneId && domain?.cloudflareDnsRecordId) {
            try {
                await deleteCloudflareDnsRecord(
                    userId,
                    domain.cloudflareZoneId,
                    domain.cloudflareDnsRecordId,
                );
            } catch (error) {
                console.error('Failed to delete Cloudflare DNS record:', error);
            }
        }
    }
}

async function processExistingDomain({
    domain,
    originalDomain,
    cloudflareInfo,
    userId,
}: {
    domain: Domain;
    originalDomain: Domain;
    cloudflareInfo: { isConnected: boolean };
    userId: string;
}): Promise<Domain> {
    let cloudflareDnsRecordId: string | undefined = domain.cloudflareDnsRecordId;

    if (!cloudflareInfo.isConnected) {
        return { ...domain, cloudflareDnsRecordId };
    }

    const hostChanged = originalDomain.host !== domain.host;
    const zoneChanged = originalDomain.cloudflareZoneId !== domain.cloudflareZoneId;
    const switchedToManual = originalDomain.cloudflareZoneId && !domain.cloudflareZoneId;
    const switchedToCloudflare = !originalDomain.cloudflareZoneId && domain.cloudflareZoneId;

    if (switchedToManual && originalDomain.cloudflareDnsRecordId) {
        cloudflareDnsRecordId = await handleSwitchToManual({
            originalDomain,
            userId,
        });
    } else if (switchedToCloudflare && domain.cloudflareZoneId && domain.cloudflareZoneName) {
        cloudflareDnsRecordId = await handleSwitchToCloudflare({
            domain,
            userId,
        });
    } else if (zoneChanged && domain.cloudflareZoneId && domain.cloudflareZoneName) {
        cloudflareDnsRecordId = await handleZoneChange({
            domain,
            originalDomain,
            userId,
        });
    } else if (
        hostChanged &&
        domain.cloudflareZoneId &&
        domain.cloudflareZoneName &&
        domain.cloudflareDnsRecordId
    ) {
        await handleHostUpdate({
            domain,
            userId,
        });
    }

    return { ...domain, cloudflareDnsRecordId };
}

async function processNewDomain({
    domain,
    cloudflareInfo,
    userId,
}: {
    domain: Domain;
    cloudflareInfo: { isConnected: boolean };
    userId: string;
}): Promise<Domain> {
    let cloudflareDnsRecordId: string | undefined = domain.cloudflareDnsRecordId;

    if (
        cloudflareInfo.isConnected &&
        domain.cloudflareZoneId &&
        domain.cloudflareZoneName &&
        !domain.cloudflareDnsRecordId
    ) {
        try {
            const subdomain = extractSubdomain(domain.host, domain.cloudflareZoneName);
            const dnsRecord = await createCloudflareDnsRecord(
                userId,
                domain.cloudflareZoneId,
                subdomain,
                domain.cloudflareZoneName,
            );
            cloudflareDnsRecordId = dnsRecord.id;
        } catch (error) {
            throw new Error(`Échec de la création du DNS pour ${domain.host}`);
        }
    }

    return { ...domain, cloudflareDnsRecordId };
}

async function handleSwitchToManual({
    originalDomain,
    userId,
}: {
    originalDomain: Domain;
    userId: string;
}): Promise<undefined> {
    try {
        await deleteCloudflareDnsRecord(
            userId,
            originalDomain.cloudflareZoneId!,
            originalDomain.cloudflareDnsRecordId!,
        );
    } catch (error) {
        console.error('Failed to delete Cloudflare DNS record:', error);
    }
    return undefined;
}

async function handleSwitchToCloudflare({
    domain,
    userId,
}: {
    domain: Domain;
    userId: string;
}): Promise<string> {
    try {
        const subdomain = extractSubdomain(domain.host, domain.cloudflareZoneName!);
        const dnsRecord = await createCloudflareDnsRecord(
            userId,
            domain.cloudflareZoneId!,
            subdomain,
            domain.cloudflareZoneName!,
        );
        return dnsRecord.id;
    } catch (error) {
        throw new Error(`Échec de la création du DNS pour ${domain.host}`);
    }
}

async function handleZoneChange({
    domain,
    originalDomain,
    userId,
}: {
    domain: Domain;
    originalDomain: Domain;
    userId: string;
}): Promise<string> {
    if (originalDomain.cloudflareZoneId && originalDomain.cloudflareDnsRecordId) {
        try {
            await deleteCloudflareDnsRecord(
                userId,
                originalDomain.cloudflareZoneId,
                originalDomain.cloudflareDnsRecordId,
            );
        } catch (error) {
            console.error('Failed to delete old Cloudflare DNS record:', error);
        }
    }

    try {
        const subdomain = extractSubdomain(domain.host, domain.cloudflareZoneName!);
        const dnsRecord = await createCloudflareDnsRecord(
            userId,
            domain.cloudflareZoneId!,
            subdomain,
            domain.cloudflareZoneName!,
        );
        return dnsRecord.id;
    } catch (error) {
        throw new Error(`Échec de la création du DNS pour ${domain.host}`);
    }
}

async function handleHostUpdate({
    domain,
    userId,
}: {
    domain: Domain;
    userId: string;
}): Promise<void> {
    try {
        const subdomain = extractSubdomain(domain.host, domain.cloudflareZoneName!);
        await updateCloudflareDnsRecord(
            userId,
            domain.cloudflareZoneId!,
            domain.cloudflareDnsRecordId!,
            subdomain,
            domain.cloudflareZoneName!,
        );
    } catch (error) {
        throw new Error(`Échec de la mise à jour du DNS pour ${domain.host}`);
    }
}

function extractSubdomain(host: string, zoneName: string): string {
    return host.replace(`.${zoneName}`, '').replace(zoneName, '');
}
