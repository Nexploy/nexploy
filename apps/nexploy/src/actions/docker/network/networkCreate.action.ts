'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { networkCreateSchema } from '@workspace/schemas-zod/network/networkAction.schema';

export const onNetworkCreateAction = actionServer
    .inputSchema(networkCreateSchema)
    .action(async ({ parsedInput }) => {
        try {
            const response = await drinoDocker.post('/networks/create', parsedInput).consume();

            await setToastServer({
                type: 'success',
                message: `Network ${parsedInput.name} créé avec succès`,
            });

            return response;
        } catch (err: unknown) {
            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message as string,
                });
            }
            throw err;
        }
    });
