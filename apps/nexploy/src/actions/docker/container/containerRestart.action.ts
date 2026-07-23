'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { containerActionsSchema } from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { byContainerIds } from '@/lib/auth/resolveOrgContext';

export const onContainerRestartAction = authActionServer
    .use(requirePermission('container', 'manage', byContainerIds))
    .inputSchema(containerActionsSchema)
    .action(async ({ parsedInput: { containerIds } }) => {
        try {
            return await kyDocker.post('container/restart', { json: { containerIds } }).json();
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
