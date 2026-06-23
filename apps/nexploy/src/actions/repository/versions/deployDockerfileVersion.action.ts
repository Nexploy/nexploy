'use server';

import { authActionServer, requirePermission } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { deployVersionSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { getTranslations } from 'next-intl/server';
import { deployDockerfileVersion } from '@/services/docker/version.service';

const ERROR_TRANSLATION_MAP: Record<string, string> = {
    repository_not_found: 'builds.buildNotFound',
    image_not_found: 'versions.imageNotFound',
};

export const onDeployDockerfileVersion = authActionServer
    .use(requirePermission('deployment', 'deploy'))
    .inputSchema(deployVersionSchema)
    .action(async ({ parsedInput }) => {
        const { imageTag, repositoryId, environmentId } = parsedInput;
        try {
            return await deployDockerfileVersion(repositoryId, imageTag, environmentId);
        } catch (err) {
            if (err instanceof Error) {
                const t = await getTranslations('repository');
                const key = ERROR_TRANSLATION_MAP[err.message] ?? 'builds.failedToDeploy';
                await setToastServer({ type: 'error', message: t(key as any) });
            }
            throw err;
        }
    });
