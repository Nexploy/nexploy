'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { kyDocker } from '@/lib/api/kyDocker';
import { ContainerRecreateFormSchema } from '@workspace/schemas-zod/docker/container/containerRecreate.schema';

export const onContainerRecreateAction = authActionServer
    .inputSchema(ContainerRecreateFormSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await kyDocker
                .post('container/recreate', { json: parsedInput })
                .json<{ id: string }>();
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
