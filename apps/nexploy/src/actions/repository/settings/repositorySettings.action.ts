'use server';

import { z } from 'zod';
import { authActionServer } from '@/lib/api/safe-action';
import { setToastServer } from '@/components/utils/toaster/toastServer';
import { removeWebhookForRepository, setupWebhookForRepository } from '@/services/webhook.service';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '../../../../prisma/prisma';
import { getGitProviderToken } from '@/services/git/git.service';
import { gitProviderService } from '@/services/api/gitProvider.service';

const toggleAutoDeploySchema = z.object({
    repositoryId: z.string(),
    autoDeploy: z.boolean(),
});

const deleteRepositorySchema = z.object({
    repositoryId: z.string(),
});

export const toggleAutoDeployAction = authActionServer
    .inputSchema(toggleAutoDeploySchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const repository = await prisma.repository.findFirst({
                where: {
                    id: parsedInput.repositoryId,
                    userId: ctx.session.user.id,
                },
            });

            if (!repository) {
                throw new Error('Repository not found');
            }

            const token = await getGitProviderToken(repository.gitProvider);
            const accessToken = await gitProviderService.getValidToken(
                token,
                repository.gitProvider,
                ctx.session.user.id,
            );

            if (parsedInput.autoDeploy && !repository.webhookId) {
                if (accessToken) {
                    const headersList = await headers();
                    const host = headersList.get('host') || 'localhost:3000';
                    const protocol = headersList.get('x-forwarded-proto') || 'http';
                    const baseUrl = `${protocol}://${host}`;

                    const webhookConfig = await setupWebhookForRepository(
                        repository.repositoryUrl,
                        repository.gitProvider,
                        accessToken,
                        ctx.session.user.id,
                        baseUrl,
                    );

                    await prisma.repository.update({
                        where: { id: parsedInput.repositoryId },
                        data: {
                            autoDeploy: true,
                            webhookId: webhookConfig.webhookId,
                            webhookSecret: webhookConfig.webhookSecret,
                        },
                    });
                } else {
                    await prisma.repository.update({
                        where: { id: parsedInput.repositoryId },
                        data: { autoDeploy: true },
                    });
                }
            } else if (!parsedInput.autoDeploy && repository.webhookId) {
                if (accessToken) {
                    await removeWebhookForRepository(parsedInput.repositoryId, accessToken);
                }
                await prisma.repository.update({
                    where: { id: parsedInput.repositoryId },
                    data: { autoDeploy: false },
                });
            } else {
                await prisma.repository.update({
                    where: { id: parsedInput.repositoryId },
                    data: { autoDeploy: parsedInput.autoDeploy },
                });
            }

            revalidatePath(`/repositories/${parsedInput.repositoryId}`);
            return { success: true, autoDeploy: parsedInput.autoDeploy };
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
            throw error;
        }
    });

export const deleteRepositoryAction = authActionServer
    .inputSchema(deleteRepositorySchema)
    .action(async ({ parsedInput, ctx }) => {
        try {
            const repository = await prisma.repository.findFirst({
                where: {
                    id: parsedInput.repositoryId,
                    userId: ctx.session.user.id,
                },
            });

            if (!repository) throw new Error('Repository not found');

            const token = await getGitProviderToken(repository.gitProvider);
            const accessToken = await gitProviderService.getValidToken(
                token,
                repository.gitProvider,
                ctx.session.user.id,
            );

            if (accessToken) {
                await removeWebhookForRepository(parsedInput.repositoryId, accessToken);
            }

            await prisma.repository.delete({
                where: { id: parsedInput.repositoryId },
            });

            redirect('/repositories');
        } catch (error: unknown) {
            if (error instanceof Error) {
                await setToastServer({
                    type: 'error',
                    message: error.message,
                });
            }
        }
    });
