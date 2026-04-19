'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { HTTPError } from 'ky';
import { volumeActionsSchema } from '@workspace/schemas-zod/docker/volume/volumeAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { getTranslations } from 'next-intl/server';

import { VolumeDeleteResponse } from '@workspace/typescript-interface/docker/docker.volume';

const skipReasonToKey: Record<string, string> = {
    in_use: 'errors.volumeSkipInUse',
    not_found: 'errors.volumeSkipNotFound',
};

export const onVolumeAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(volumeActionsSchema)
    .action(async ({ parsedInput: { action, volumeNames } }) => {
        try {
            const result = await kyDocker
                .post(`volumes/${action}`, { json: { volumeNames } })
                .json<VolumeDeleteResponse>();

            if (result.skipped?.length) {
                const t = await getTranslations('docker');
                for (const skipped of result.skipped) {
                    const key = skipReasonToKey[skipped.reason];
                    const message = key ? t(key, { count: 1, name: skipped.name }) : skipped.reason;
                    await setToastServer({ type: 'error', message });
                }
            }

            return result;
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                const body = await err.response.json<{ message: string }>();
                await setToastServer({ type: 'error', message: body.message ?? err.message });
            }
        }
    });
