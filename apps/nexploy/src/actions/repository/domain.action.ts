'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { generateTraefikConfigForRepository } from '@/services/traefik.service';
import { domainsFormSchema } from '@workspace/schemas-zod/repository/domain.schema';

export const onDomainAction = authActionServer
    .inputSchema(domainsFormSchema)
    .action(async ({ parsedInput }) => {
        const { repositoryId, domains, deletedIds } = parsedInput;

        try {
            const cleanedDomains = domains.map((d) => ({
                ...d,
                host: d.host.replace(/^https?:\/\//, ''),
            }));

            const existingDomains = cleanedDomains.filter(
                (d) => d.id && !deletedIds.includes(d.id),
            );

            const newDomains = cleanedDomains.filter((d) => !d.id);

            const allDomains = [
                ...existingDomains,
                ...newDomains.map((d) => ({
                    ...d,
                    id: crypto.randomUUID(),
                })),
            ];

            await generateTraefikConfigForRepository(repositoryId, domains);

            return allDomains;
        } catch (error) {
            await setToastServer({
                type: 'error',
                message: 'Erreur lors de la mise à jour des domaines',
            });

            throw error;
        }
    });
