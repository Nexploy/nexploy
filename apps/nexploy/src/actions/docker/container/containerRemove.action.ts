'use server';

import { authActionServer, requirePermission, requireUnprotectedEnvironment } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { containerRemoveSchema } from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { byContainerIds } from '@/lib/auth/resolveOrgContext';

export const onContainerRemoveAction = authActionServer
    .metadata({ name: 'container.remove' })
    .use(requirePermission('container', 'remove', byContainerIds))
    .use(requireUnprotectedEnvironment('container.remove'))
    .inputSchema(containerRemoveSchema)
    .action(async ({ parsedInput: { containerIds, force } }) => {
        try {
            return await kyDocker.delete('container/remove', { json: { containerIds, force } }).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
            throw err;
        }
    });
