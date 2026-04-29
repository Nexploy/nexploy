'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { domainsFormSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { getDomainsFromTraefikConfig } from '@/services/traefik.service';
import { applyDomainOperations, classifyDomainOperations } from '@/services/domain.service';
import { setToastServer } from '@/lib/toastServer.ts';

export const manageDomains = authActionServer
    .use(requirePermission('repository', 'update'))
    .inputSchema(domainsFormSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            const { domains, deletedIds } = parsedInput;

            const existingDomains = await getDomainsFromTraefikConfig(repositoryId);

            const operations = classifyDomainOperations(domains, existingDomains, deletedIds);

            return await applyDomainOperations({
                repositoryId,
                operations,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });
