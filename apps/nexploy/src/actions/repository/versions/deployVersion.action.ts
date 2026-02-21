'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { deployVersionSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { getTranslations } from 'next-intl/server';
import { deployComposeVersion, deployDockerfileVersion } from '@/services/docker/version.service';

const ERROR_TRANSLATION_MAP: Record<string, string> = {
    repository_not_found: 'builds.buildNotFound',
    compose_config_not_found: 'versions.composeConfigNotFound',
    image_not_found: 'versions.imageNotFound',
};

async function handleDeployError(err: unknown) {
    if (err instanceof Error) {
        const t = await getTranslations('repository');
        const key = ERROR_TRANSLATION_MAP[err.message] ?? 'builds.failedToDeploy';
        await setToastServer({ type: 'error', message: t(key as any) });
    }
    throw err;
}

export const onDeployDockerfileVersion = authActionServer
    .inputSchema(deployVersionSchema)
    .action(async ({ parsedInput }) => {
        const { imageTag, repositoryId, environmentId } = parsedInput;
        try {
            return await deployDockerfileVersion(repositoryId, imageTag, environmentId);
        } catch (err) {
            await handleDeployError(err);
        }
    });

export const onDeployComposeVersion = authActionServer
    .inputSchema(deployVersionSchema)
    .action(async ({ parsedInput }) => {
        const { imageTag, repositoryId, environmentId } = parsedInput;
        try {
            return await deployComposeVersion(repositoryId, imageTag, environmentId);
        } catch (err) {
            await handleDeployError(err);
        }
    });
