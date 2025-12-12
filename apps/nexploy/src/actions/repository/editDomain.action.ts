'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { domainsFormSchema } from '@workspace/schemas-zod/repository/domain.schema';
import { repositoryIdSchema } from '@workspace/schemas-zod/bind/repositoryId.schema';
import { updateRepositoryDomains } from '@/services/domain.service';
import { getDomainsFromTraefikConfig } from '@/services/traefik.service';
import { Domain } from '@workspace/typescript-interface/traefik/traefik.config';

export const onEditDomainAction = authActionServer
    .inputSchema(domainsFormSchema)
    .bindArgsSchemas(repositoryIdSchema)
    .action(async ({ parsedInput, ctx, bindArgsParsedInputs: [repositoryId] }) => {
        try {
            const { domains, deletedIds } = parsedInput;
            const userId = ctx.session.user.id;
            const existingDomains = await getDomainsFromTraefikConfig(repositoryId);

            const add: Domain[] = domains.filter((d) => !d.id);
            const edit: Domain[] = domains.filter((d) => {
                if (!d.id || deletedIds.includes(d.id)) return false;
                const original = existingDomains.find((ed) => ed.id === d.id);
                return original && JSON.stringify(d) !== JSON.stringify(original);
            });
            const deleteDomains: Domain[] = existingDomains.filter(
                (d) => d.id && deletedIds.includes(d.id),
            );

            return await updateRepositoryDomains({
                repositoryId,
                userId,
                add,
                edit,
                delete: deleteDomains,
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
