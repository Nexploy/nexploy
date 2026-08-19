'use server';

import { HTTPError } from 'ky';
import { volumeTransferFormSchema } from '@workspace/schemas-zod/docker/volume/volumeTransfer.schema';
import {
    authActionServer,
    fromInputField,
    requirePermission,
    requireUnprotectedEnvironment,
} from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { setToastServer } from '@/lib/toastServer';

export const onVolumeTransferAction = authActionServer
    .metadata({ name: 'volume.transfer' })
    .use(requirePermission('volume', 'manage'))
    .use(requireUnprotectedEnvironment('volume.manage'))
    .use(requireUnprotectedEnvironment('volume.manage', fromInputField('targetEnvironmentId')))
    .inputSchema(volumeTransferFormSchema)
    .action(async ({ parsedInput: { volumeNames, targetEnvironmentId, overwrite, stopMode } }) => {
        try {
            return await kyDocker
                .post('volumes/transfer', {
                    json: { volumeNames, targetEnvironmentId, overwrite, stopMode },
                })
                .json<{ taskId: string; name: string }>();
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
