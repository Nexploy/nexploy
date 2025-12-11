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

export const onDomainAction = authActionServer
    .inputSchema(domainsFormSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { repositoryId, domains, deletedIds } = parsedInput;
        const userId = ctx.session.user.id;

        try {
            const cloudflareInfo = await getCloudflareCredentialInfo(userId);
            const existingDomains = await getDomainsFromTraefikConfig(repositoryId);

            const cleanedDomains = domains.map((d) => ({
                ...d,
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

            const keptDomains = cleanedDomains.filter((d) => d.id && !deletedIds.includes(d.id));

            const newDomainsWithIds = await Promise.all(
                cleanedDomains
                    .filter((d) => !d.id)
                    .map(async (d) => {
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
                            id: `repo-${repositoryId}-${d.host}`,
                            cloudflareDnsRecordId,
                        };
                    }),
            );

            const allDomains = [...keptDomains, ...newDomainsWithIds];

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
