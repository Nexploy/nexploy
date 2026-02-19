'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/lib/toastServer';
import { deployVersionSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { kyDocker } from '@/lib/api/kyDocker';
import { decrypt } from '@/lib/encryption';
import { getTranslations } from 'next-intl/server';
import { getRepositorieWithEnv } from '@/services/repository.service';
import { prisma } from '@/../prisma/prisma';
import { Image } from '@workspace/typescript-interface/docker/docker.image';
import { ComposeContent } from '@workspace/typescript-interface/docker/docker.compose.build';
import * as yaml from 'yaml';

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

            if (repository.buildType === 'DOCKER_COMPOSE') {
                const version = await prisma.version.findUnique({
                    where: { repositoryId_imageTag: { repositoryId, imageTag } },
                });

                if (!version?.composeConfig) {
                    throw new Error(t('versions.composeConfigNotFound'));
                }

                const composeYaml = Buffer.from(version.composeConfig, 'base64').toString('utf8');
                const composeContent = yaml.parse(composeYaml) as ComposeContent;
                const builtServices = Object.values(composeContent.services || {}).filter(
                    (s) => s.build && s.image,
                );

                if (builtServices.length > 0) {
                    const allImages = await kyDocker.get('images').json<Image[]>();
                    const missingImages = builtServices.filter(
                        (s) => !allImages.some((img) => img.repoTags.includes(s.image!)),
                    );

                    if (missingImages.length > 0) {
                        throw new Error(t('versions.imageNotFound'));
                    }
                }

                return await kyDocker
                    .post('pipeline/deploy-compose', {
                        json: {
                            repositoryId,
                            projectName: `nexploy-${repositoryId}`,
                            envVars: envVariables,
                            composeConfig: version.composeConfig,
                        },
                    })
                    .json();
            }

            const imageName = `${repositoryId}:${imageTag}`;

            const images = await kyDocker
                .get('images', { searchParams: { name: repositoryId } })
                .json<Image[]>();

            const imageExists = images.some((img) => img.repoTags.includes(imageName));

            if (!imageExists) {
                throw new Error(t('versions.imageNotFound'));
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
                    message: (await getTranslations('repository'))('builds.failedToDeploy'),
                });
            }
            throw err;
        }
    });
