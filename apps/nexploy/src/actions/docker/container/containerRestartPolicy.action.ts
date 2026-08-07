'use server';

import { authActionServer, requirePermission, requireUnprotectedEnvironment } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { containerRestartPolicySchema } from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { byContainerIds } from '@/lib/auth/resolveOrgContext';

export const onContainerRestartPolicyAction = authActionServer
    .metadata({ name: 'container.restartPolicy' })
    .use(requirePermission('container', 'manage', byContainerIds))
    .use(requireUnprotectedEnvironment('container.update'))
    .inputSchema(containerRestartPolicySchema)
    .action(async ({ parsedInput: { containerId, policy, maximumRetryCount } }) => {
        try {
            return await kyDocker
                .post('container/restart-policy', { json: { containerId, policy, maximumRetryCount } })
                .json();
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
