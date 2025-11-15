'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { containerActionsSchema } from '@workspace/schemas-zod/container/containerAction.schema';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onContainerRemoveAction = actionServer
    .inputSchema(containerActionsSchema)
    .action(async ({ parsedInput: { containerId } }) => {
        try {
            return await drinoDocker.delete(`/container/${containerId}/remove`).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
