'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { deleteDomainSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { getDomainsFromTraefikConfig } from '@/services/traefik.service';
import { applyDomainOperations } from '@/services/domain.service';
import { setToastServer } from '@/lib/toastServer.ts';
import { revalidatePath } from 'next/cache';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const deleteDomain = authActionServer
    .use(requirePermission('domain', 'manage'))
    .inputSchema(deleteDomainSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput: { domainId }, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            const existingDomains = await getDomainsFromTraefikConfig(repositoryId);
            const domainToDelete = existingDomains.find((d) => d.id === domainId);

            if (!domainToDelete) {
                throw new Error((await getErrorTranslator())('domain.notFound'));
            }

            await applyDomainOperations({
                repositoryId,
                operations: {
                    add: [],
                    edit: [],
                    delete: [domainToDelete],
                    unchanged: existingDomains.filter((d) => d.id !== domainId),
                },
            });

            revalidatePath('/repositories/[repositoryId]', 'page');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
