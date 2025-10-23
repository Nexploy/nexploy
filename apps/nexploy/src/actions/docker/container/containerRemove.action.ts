'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { ContainerActionsSchema } from '@workspace/schemas-zod/container/containerAction.schema';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onContainerRemoveAction = actionServer
    .inputSchema(ContainerActionsSchema)
    .action(async ({ parsedInput: { containerId } }) => {
        try {
            await drinoDocker.delete(`/containers/${containerId}/remove`).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
