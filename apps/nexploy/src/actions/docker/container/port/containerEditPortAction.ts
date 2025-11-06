'use server';

import { actionServer } from '@/lib/api/safe-action';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { drinoDocker } from '@/lib/api/drinoDocker';
import {
    bindCurrentPort,
    containerPortSchema,
} from '@workspace/schemas-zod/container/containerPort.schema';

export const onContainerEditPortAction = actionServer
    .inputSchema(containerPortSchema)
    .bindArgsSchemas(bindCurrentPort)
    .action(
        async ({
            parsedInput: { containerId, ...restInput },
            bindArgsParsedInputs: [currentValueEdit],
        }) => {
            try {
                return await drinoDocker
                    .patch<{
                        id: string;
                    }>(`/container/${containerId}/port`, { ...restInput, ...currentValueEdit })
                    .consume();
            } catch (err: unknown) {
                if (err instanceof HttpErrorResponse) {
                    await setToastServer({
                        type: 'error',
                        message: err.error.message as string,
                    });
                }
            }
        },
    );
