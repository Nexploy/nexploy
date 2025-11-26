'use server';

import { z } from 'zod';
import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { HttpErrorResponse } from 'drino';
import { prisma } from '../../../prisma/prisma';

const deployInputSchema = z.object({
    projectId: z.string(),
});

interface BuildStartResponse {
    jobId: string;
    status: string;
    message: string;
}

export const onDeployAction = authActionServer
    .inputSchema(deployInputSchema)
    .action(async ({ parsedInput, ctx }) => {
        const { projectId } = parsedInput;

        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: ctx.session.user.id },
            include: {
                envVariables: true,
            },
        });

        if (!project) {
            await setToastServer({
                type: 'error',
                message: 'Project not found',
            });
            throw new Error('Project not found');
        }

        const account = await prisma.account.findFirst({
            where: {
                userId: ctx.session.user.id,
                providerId: project.gitProvider,
            },
            select: { accessToken: true },
        });

        const deployment = await prisma.deployment.create({
            data: {
                projectId: project.id,
                status: 'QUEUED',
            },
        });

        const imageName = `nexploy-${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        const envVariables: Record<string, string> = {};
        for (const env of project.envVariables) {
            envVariables[env.key] = env.value;
        }

        const buildConfig = {
            projectId: project.id,
            projectPath: project.contextPath || '.',
            gitUrl: project.repositoryUrl,
            gitBranch: project.branch,
            gitToken: account!.accessToken,
            envVariables,
            dockerfilePath: project.dockerfilePath || undefined,
            imageName,
            imageTag: deployment.id.slice(-8),
            autoDeploy: project.autoDeploy,
        };

        try {
            const result = await drinoDocker
                .post<BuildStartResponse>('/build/start', buildConfig)
                .consume();

            await prisma.deployment.update({
                where: { id: deployment.id },
                data: { status: 'BUILDING' },
            });

            await setToastServer({
                type: 'success',
                message: 'Build started successfully',
            });

            return {
                deploymentId: deployment.id,
                jobId: result.jobId,
                status: result.status,
            };
        } catch (err: unknown) {
            await prisma.deployment.update({
                where: { id: deployment.id },
                data: { status: 'FAILED' },
            });

            if (err instanceof HttpErrorResponse) {
                await setToastServer({
                    type: 'error',
                    message: err.error.message || 'Failed to start build',
                });
            }
            throw err;
        }
    });
