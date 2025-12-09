'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { initActionSchema } from '@workspace/schemas-zod/docker/swarm/init.schema';

export const onInitSwarmAction = authActionServer
    .inputSchema(initActionSchema)
    .action(async ({ parsedInput: { advertiseAddr, listenAddr } }) => {
        try {
            return await drinoDocker
                .post(`/swarm/init`, {
                    advertiseAddr,
                    listenAddr,
                })
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
