'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { ContainerCreateFormSchema } from '@workspace/schemas-zod/container/containerCreate.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onContainerCreateAction = actionServer
    .inputSchema(ContainerCreateFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            await drinoDocker.post(`/containers/create`, parsedInput).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
