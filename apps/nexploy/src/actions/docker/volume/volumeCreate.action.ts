'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HttpErrorResponse } from 'drino';
import { volumeCreateSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { setToastServer } from '@/components/utils/toaster/toastServer';

export const onVolumeCreateAction = authActionServer
    .inputSchema(volumeCreateSchema)
    .action(async ({ parsedInput }) => {
        try {
            const response = await kyDocker.post('volumes/create', { json: parsedInput }).json();

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
