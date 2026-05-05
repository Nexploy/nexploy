'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { containerRenameSchema } from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';

export const onContainerRenameAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(containerRenameSchema)
    .action(async ({ parsedInput: { containerId, name } }) => {
        try {
            return await kyDocker.post(`container/${containerId}/rename`, { json: { name } }).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
