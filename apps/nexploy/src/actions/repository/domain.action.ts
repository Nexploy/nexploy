'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { prisma } from '../../../prisma/prisma';
import { generateTraefikConfigForRepository } from '@/services/traefik.service';
import { domainsFormSchema } from '@workspace/schemas-zod/repository/domain.schema';

export const onDomainAction = authActionServer
    .inputSchema(domainsFormSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { repositoryId, domains, deletedIds } = parsedInput;

        const repository = await prisma.repository.findUnique({
            where: {
                id: repositoryId,
                userId: ctx.session.user.id,
            },
        });

        if (!repository) {
            await setToastServer({
                type: 'error',
                message: 'Repository introuvable ou accès non autorisé',
            });
            throw new Error('Repository not found');
        }

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
