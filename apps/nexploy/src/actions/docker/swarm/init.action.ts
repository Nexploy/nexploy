'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { initActionSchema } from '@workspace/schemas-zod/docker/swarm/init.schema';

export const onInitSwarmAction = authActionServer
    .inputSchema(initActionSchema)
    .action(async ({ parsedInput: { advertiseAddr, listenAddr } }) => {
        try {
            return await kyDocker
                .post(`swarm/init`, {
                    json: {
                        advertiseAddr,
                        listenAddr,
                    },
                })
                .json();
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
        }
    });
