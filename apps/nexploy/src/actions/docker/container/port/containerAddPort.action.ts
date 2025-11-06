'use server';

import { actionServer } from '@/lib/api/safe-action';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { containerPortSchema } from '@workspace/schemas-zod/container/containerPort.schema';

export const onContainerAddPortAction = actionServer
    .inputSchema(containerPortSchema)
    .action(async ({ parsedInput: { containerId, ...restInput } }) => {
        try {
            return await drinoDocker
                .put<{ id: string }>(`/container/${containerId}/port`, restInput)
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
