'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { deleteRegistrySchema } from '@workspace/schemas-zod/registry/registry.schema';
import { revalidatePath } from 'next/cache';
import { kyDocker } from '@/lib/api/kyDocker.ts';
import { deleteRegistry, getRegistryById } from '@/services/registry.service';
import { deleteLocalRegistryTraefikConfig } from '@/services/localRegistry.service';
import { hasPermission } from '@/lib/auth/permissions';
import { ForbiddenError } from '@/lib/activity/forbiddenError';
import { getTranslations } from 'next-intl/server';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer.ts';

export const deleteRegistryAction = authActionServer
    .metadata({ name: 'registry.delete' })
    .use(requirePermission('registry', 'delete'))
    .inputSchema(deleteRegistrySchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const registry = await getRegistryById(parsedInput.id);
            const removeContainer = parsedInput.removeContainer && !!registry?.containerName;

            if (removeContainer && !hasPermission(ctx.session.user.role as string, 'container', 'manage')) {
                const t = await getTranslations('common');
                await setToastServer({ type: 'error', message: t('forbidden') });
                throw new ForbiddenError(t('forbidden'));
            }

            await deleteRegistry(parsedInput.id);

            if (registry?.url) {
                try {
                    await kyDocker.post('registries/logout', {
                        json: { serveraddress: registry.url },
                    });
                } catch {
                    /* empty */
                }
            }

            if (removeContainer) {
                await kyDocker.delete('container/remove', {
                    json: { containerIds: [registry!.containerName], force: true },
                });

                if (registry?.url) {
                    await deleteLocalRegistryTraefikConfig(registry.url);
                }
            }

            revalidatePath('/registry');
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                const body = await err.response.json<{ message: string }>();
                await setToastServer({ type: 'error', message: body.message ?? err.message });
            }
            throw err;
        }
    });
