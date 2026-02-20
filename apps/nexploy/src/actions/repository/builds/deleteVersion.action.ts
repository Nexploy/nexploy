'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { deleteVersionSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/../prisma/prisma';
import { HttpError } from '@workspace/shared/http-error';

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

            await prisma.version.deleteMany({
                where: { repositoryId, imageTag },
            });

            return { success: true };
        } catch (err: unknown) {
            if (err instanceof HttpError) {
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
