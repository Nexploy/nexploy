'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { containerActionsSchema } from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { HTTPError } from 'ky';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onContainerRestartAction = authActionServer
    .inputSchema(containerActionsSchema)
    .action(async ({ parsedInput: { containerId } }) => {
        try {
            return await kyDocker.post(`/container/${containerId}/restart`).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
