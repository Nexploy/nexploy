'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { composesActionsSchema } from '@workspace/schemas-zod/docker/composes/composesAction.schema';

export const onComposesAction = authActionServer
    .inputSchema(composesActionsSchema)
    .action(async ({ parsedInput: { stackName, action } }) => {
        try {
            await drinoDocker.post(`/composes/${stackName}/${action}`, null).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
