'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { swarmJoinSchema } from '@workspace/schemas-zod/docker/swarm/join.schema';

export const onSwarmJoinAction = authActionServer
    .inputSchema(swarmJoinSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await kyDocker.post(`swarm/join`, { json: parsedInput }).json();
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({ type: 'error', message: err.error.message as string });
            }
        }
    });
