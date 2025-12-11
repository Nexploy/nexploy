'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import {
    generateTraefikConfigForRepository,
    getDomainsFromTraefikConfig,
} from '@/services/traefik.service';
import { domainsFormSchema } from '@workspace/schemas-zod/repository/domain.schema';
import {
    createCloudflareDnsRecord,
    deleteCloudflareDnsRecord,
    getCloudflareCredentialInfo,
} from '@/services/cloudflare.service';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';

export const onEditDomainAction = authActionServer
    .inputSchema(domainsFormSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput, ctx, bindArgsParsedInputs: [repositoryId] }) => {
        const { domains, deletedIds } = parsedInput;
        const userId = ctx.session.user.id;

        try {
            const cloudflareInfo = await getCloudflareCredentialInfo(userId);
            const existingDomains = await getDomainsFromTraefikConfig(repositoryId);

            const cleanedDomains = domains.map((d) => ({
                ...d,
                id: `repo-${repositoryId}-${d.host}`,
                host: d.host.replace(/^https?:\/\//, ''),
            }));

            if (cloudflareInfo.isConnected) {
                for (const deletedId of deletedIds) {
                    const deletedDomain = existingDomains.find((d) => d.id === deletedId);
                    if (deletedDomain?.cloudflareZoneId && deletedDomain?.cloudflareDnsRecordId) {
                        try {
                            await deleteCloudflareDnsRecord(
                                userId,
                                deletedDomain.cloudflareZoneId,
                                deletedDomain.cloudflareDnsRecordId,
                            );
                        } catch (error) {
                            console.error('Failed to delete Cloudflare DNS record:', error);
                        }
                    }
                }
            }

            const existingDomainIds = existingDomains.map((d) => d.id);
            const newDomainsToProcess = cleanedDomains.filter(
                (d) => !existingDomainIds.includes(d.id),
            );
            const existingDomainsToKeep = cleanedDomains.filter((d) =>
                existingDomainIds.includes(d.id),
            );

            const processedNewDomains = await Promise.all(
                newDomainsToProcess.map(async (d) => {
                    let cloudflareDnsRecordId: string | undefined = d.cloudflareDnsRecordId;

                    if (
                        cloudflareInfo.isConnected &&
                        d.cloudflareZoneId &&
                        d.cloudflareZoneName &&
                        !d.cloudflareDnsRecordId
                    ) {
                        try {
                            const subdomain = d.host
                                .replace(`.${d.cloudflareZoneName}`, '')
                                .replace(d.cloudflareZoneName, '');

                            const dnsRecord = await createCloudflareDnsRecord(
                                userId,
                                d.cloudflareZoneId,
                                subdomain,
                                d.cloudflareZoneName,
                            );
                            cloudflareDnsRecordId = dnsRecord.id;
                        } catch (error) {
                            throw new Error(`Échec de la création du DNS pour ${d.host}`);
                        }
                    }

                    return {
                        ...d,
                        cloudflareDnsRecordId,
                    };
                }),
            );

            const allDomains = [...existingDomainsToKeep, ...processedNewDomains];

            await generateTraefikConfigForRepository(repositoryId, allDomains);

            return allDomains;
        } catch (error) {
            await setToastServer({
                type: 'error',
                message: 'Erreur lors de la mise à jour des domaines',
            });

            throw error;
        }
    });
