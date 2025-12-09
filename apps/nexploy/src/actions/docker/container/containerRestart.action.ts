'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { containerActionsSchema } from '@workspace/schemas-zod/docker/container/containerAction.schema';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onContainerRestartAction = authActionServer
    .inputSchema(containerActionsSchema)
    .action(async ({ parsedInput: { containerId } }) => {
        try {
            await drinoDocker.post(`/container/${containerId}/restart`, null).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
