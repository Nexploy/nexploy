'use server';

import { actionServer } from '@/lib/api/safe-action';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { VolumeCreateSchema } from '@workspace/schemas-zod/volume/volumeAction.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onVolumeCreate = actionServer
    .inputSchema(VolumeCreateSchema)
    .action(async ({ parsedInput }) => {
        try {
            const response = await drinoDocker.post('/volumes/create', parsedInput).consume();

            await setToastServer({
                type: 'success',
                message: `Volume ${parsedInput.name} créé avec succès`,
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
