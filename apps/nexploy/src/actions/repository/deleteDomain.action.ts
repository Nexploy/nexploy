'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { deleteDomainSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { getDomainsFromTraefikConfig } from '@/services/traefik.service';
import { applyDomainOperations } from '@/services/domain.service';
import { setToastServer } from '@/lib/toastServer.ts';

export const deleteDomain = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(deleteDomainSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput: { domainId }, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            const existingDomains = await getDomainsFromTraefikConfig(repositoryId);
            const domainToDelete = existingDomains.find((d) => d.id === domainId);

            if (!domainToDelete) {
                throw new Error('Domain not found');
            }

            return await applyDomainOperations({
                repositoryId,
                operations: {
                    add: [],
                    edit: [],
                    delete: [domainToDelete],
                    unchanged: existingDomains.filter((d) => d.id !== domainId),
                },
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
