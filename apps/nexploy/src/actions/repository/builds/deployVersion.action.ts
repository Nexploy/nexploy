'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { deployVersionSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { decrypt } from '@/lib/encryption';
import { getTranslations } from 'next-intl/server';
import { getRepositorieWithEnv } from '@/services/repository.service';

export const onDeployVersion = authActionServer
    .inputSchema(deployVersionSchema)
    .action(async ({ parsedInput }) => {
        try {
            const t = await getTranslations('repository');
            const { imageTag, repositoryId } = parsedInput;

            const repository = await getRepositorieWithEnv(repositoryId);

            if (!repository) {
                throw new Error(t('builds.buildNotFound'));
            }

            const envVariables: Record<string, string> = {};
            for (const envVar of repository.envVariables) {
                envVariables[envVar.key] = decrypt(envVar.value);
            }

            const imageName = `${repositoryId}:${imageTag}`;

            if (repository.buildType === 'DOCKER_COMPOSE') {
                return await kyDocker
                    .post('pipeline/deploy-compose', {
                        json: {
                            repositoryId,
                            buildId: imageTag,
                            projectName: `nexploy-${repositoryId}`,
                            envVars: envVariables,
                        },
                    })
                    .json();
            }

            return await kyDocker
                .post('pipeline/deploy', {
                    json: {
                        repositoryId,
                        imageName,
                        options: {
                            envVars: envVariables,
                        },
                    },
                })
                .json();
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message:
                        err.message ||
                        (await getTranslations('repository'))('builds.failedToDeploy'),
                });
            }
            throw err;
        }
    });
