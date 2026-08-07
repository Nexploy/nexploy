'use server';

import { authActionServer, requirePermission, requireUnprotectedEnvironment } from '@/lib/api/safe-action';
import { kyDocker } from '@/lib/api/kyDocker';
import { imageUntagSchema } from '@workspace/schemas-zod/docker/image/imageAction.schema';
import { setToastServer } from '@/lib/toastServer';
import { HTTPError } from 'ky';
import { getTranslations } from 'next-intl/server';
import type { ImageUntagResponse } from '@workspace/typescript-interface/docker/docker.image';

const skipReasonToKey: Record<string, string> = {
    not_found: 'errors.imageUntagNotFound',
    last_tag: 'errors.imageUntagLastTag',
};

export const onImageUntagAction = authActionServer
    .metadata({ name: 'image.untag' })
    .use(requirePermission('image', 'manage'))
    .use(requireUnprotectedEnvironment('image.manage'))
    .inputSchema(imageUntagSchema)
    .action(async ({ parsedInput: { tags } }) => {
        try {
            const result = await kyDocker.post('images/untag', { json: { tags } }).json<ImageUntagResponse>();

            if (result.skipped.length) {
                const t = await getTranslations('docker');
                for (const skipped of result.skipped) {
                    const key = skipReasonToKey[skipped.reason];
                    const message = key ? t(key, { name: skipped.tag }) : skipped.reason;
                    await setToastServer({ type: 'error', message });
                }
            }

            return result;
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                await setToastServer({ type: 'error', message: err.message });
            }
            throw err;
        }
    });
