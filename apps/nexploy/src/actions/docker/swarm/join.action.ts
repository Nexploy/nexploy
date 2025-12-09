'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { swarmJoinSchema } from '@workspace/schemas-zod/docker/swarm/join.schema';

export const onSwarmJoinAction = authActionServer
    .inputSchema(swarmJoinSchema)
    .action(async ({ parsedInput }) => {
        try {
            await drinoDocker.post(`/swarm/join`, parsedInput).consume();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({ type: 'error', message: err.error.message as string });
            }
        }
    });
