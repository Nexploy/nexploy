'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { imageActionsSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';
import { getTranslations } from 'next-intl/server';
import { ImageDeleteResponse } from '@workspace/typescript-interface/docker/docker.image';

const skipReasonToKey: Record<string, string> = {
    in_use: 'errors.imageSkipInUse',
    not_found: 'errors.imageSkipNotFound',
};

export const onImageAction = authActionServer
    .use(requirePermission('docker', 'manage'))
    .inputSchema(imageActionsSchema)
    .action(async ({ parsedInput: { action, imageIds, force } }) => {
        try {
            const result = await kyDocker
                .post(`images/${action}`, { json: { imageIds, force } })
                .json<ImageDeleteResponse>();

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
