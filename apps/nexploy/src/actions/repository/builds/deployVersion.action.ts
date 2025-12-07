'use server';

import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { deployVersionSchema } from '@workspace/schemas-zod/inngest/build.schema';
import { prisma } from '../../../../prisma/prisma';
import { drinoDocker } from '@/lib/api/drinoDocker';

export const onDeployVersion = authActionServer
    .inputSchema(deployVersionSchema)
    .action(async ({ parsedInput }) => {
        try {
            const { buildId, repositoryId } = parsedInput;

            const build = await prisma.build.findUnique({
                where: { id: buildId },
                include: {
                    repository: {
                        include: {
                            envVariables: true,
                        },
                    },
                },
            });

            if (!build || build.status !== 'COMPLETED') {
                throw new Error('Build not found or not completed');
            }

            if (build.repositoryId !== repositoryId) {
                throw new Error('Build does not belong to this repository');
            }

            const imageName = `${repositoryId}:${buildId}`;

            const envVariables: Record<string, string> = {};
            for (const envVar of build.repository.envVariables) {
                envVariables[envVar.key] = envVar.value;
            }

            await drinoDocker
                .post('/pipeline/deploy', {
                    repositoryId,
                    imageName,
                    options: {
                        envVars: envVariables,
                    },
                })
                .consume();
        } catch (err: unknown) {
            if (err instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: err.message || 'Failed to deploy version',
                });
            }
            throw err;
        }
    });
