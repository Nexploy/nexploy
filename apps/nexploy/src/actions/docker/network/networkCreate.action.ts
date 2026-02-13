'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { networkCreateSchema } from '@workspace/schemas-zod/docker/network/networkAction.schema';
import { HTTPError } from 'ky';

export const onNetworkCreateAction = authActionServer
    .inputSchema(networkCreateSchema)
    .action(async ({ parsedInput }) => {
        try {
            const response = await kyDocker.post('networks/create', { json: parsedInput }).json();

            await setToastServer({
                type: 'success',
                message: `Network ${parsedInput.name} créé avec succès`,
            });

            return response;
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({
                    type: 'error',
                    message: err.message as string,
                });
            }
            throw err;
        }
    });
