'use server';

import { actionServer } from '@/lib/api/safe-action';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { ContainerRecreateFormSchema } from '@workspace/schemas-zod/container/containerRecreate.schema';

export const onContainerRecreateAction = actionServer
    .inputSchema(ContainerRecreateFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await drinoDocker
                .post<{ id: string }>(`/container/recreate`, parsedInput)
                .consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
            return null;
        }
    });
