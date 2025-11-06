'use server';

import { actionServer } from '@/lib/api/safe-action';
import { HttpErrorResponse } from 'drino';
import { ContainerCreateFormSchema } from '@workspace/schemas-zod/container/containerCreate.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { drinoDocker } from '@/lib/api/drinoDocker';

export const onContainerCreateAction = actionServer
    .inputSchema(ContainerCreateFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await drinoDocker
                .post<{ id: string }>(`/container/create`, parsedInput)
                .consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
        }
    });
