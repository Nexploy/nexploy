'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/lib/toastServer';
import { swarmJoinSchema } from '@workspace/schemas-zod/docker/swarm/join.schema';

export const onSwarmJoinAction = authActionServer
    .inputSchema(swarmJoinSchema)
    .action(async ({ parsedInput }) => {
        try {
            return await kyDocker.post(`swarm/join`, { json: parsedInput }).json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message as string });
            }
        }
    });
