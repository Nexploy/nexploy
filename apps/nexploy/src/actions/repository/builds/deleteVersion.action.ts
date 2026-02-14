'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { deleteVersionSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { getTranslations } from 'next-intl/server';

export const onDeleteVersion = authActionServer
    .inputSchema(deleteVersionSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { imageTag, repositoryId } = parsedInput;

            await kyDocker
                .post('images/delete', {
                    json: { imageIds: [`${repositoryId}:${imageTag}`] },
                })
                .json();

            return { success: true };
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message:
                        err.message ||
                        (await getTranslations('repository'))('versions.deleteError'),
                });
            }
            throw err;
        }
    });
