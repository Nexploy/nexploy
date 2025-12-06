import { RepositoryCreateForm } from '@workspace/schemas-zod/repository/repositoryCreate.schema';
import { Session } from '@/lib/auth/auth';
import { prisma } from '../../prisma/prisma';
import { WebhookConfig } from '@workspace/schemas-zod/repository/webhook.schema';
import { getGitProviderToken } from '@/services/git/git.service';
import { tokenStorage } from '@/lib/storage/token-storage';
import { getUserSession } from '@/services/auth/auth.service';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { getValidToken } from '@/services/api/gitProvider.service';
import {
    removeWebhookForRepository,
    setupWebhookForRepository,
} from '@/services/webhook/webhook.service';

export async function createRepository(
    { repo, ...restRepositoryCreate }: RepositoryCreateForm,
    ctx: { session: Session },
) {
    try {
        let webhookValues: WebhookConfig | null = null;

        if (restRepositoryCreate.autoDeploy) {
            const token = await getGitProviderToken(restRepositoryCreate.gitProvider);
            const accessToken = await getValidToken(
                token,
                restRepositoryCreate.gitProvider,
                ctx.session.user.id,
            );

            if (accessToken) {
                const baseUrl = await getBaseUrl();

                webhookValues = await setupWebhookForRepository(
                    repo.url,
                    restRepositoryCreate.gitProvider,
                    ctx.session.user.id,
                    baseUrl,
                );
            }
        }

        const repository = await prisma.repository.create({
            data: {
                ...restRepositoryCreate,
                gitId: repo.id,
                webhookId: webhookValues?.webhookId,
                webhookSecret: webhookValues?.webhookSecret,
                repositoryUrl: repo.url,
                userId: ctx.session.user.id,
            },
        });

        return repository.id;
    } catch (error: unknown) {
        throw new Error('Failed to create repository');
    }
}

export async function getRepositorieById(repositoryId: string) {
    try {
        const repository = await prisma.repository.findUnique({
            where: {
                id: repositoryId,
            },
        });

        if (!repository) {
            return null;
        }

        return repository;
    } catch (error: unknown) {
        throw new Error('Failed to get repository');
    }
}

export function getRepositories() {
    try {
        return prisma.repository.findMany({
            include: {
                build: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get repository');
    }
}

export async function getRepositorieWithEnv(repositoryId: string) {
    try {
        return await prisma.repository.findUnique({
            where: { id: repositoryId },
            include: {
                envVariables: true,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get repository with env');
    }
}

export async function getRepositorieBuildLogs(repositoryId: string, buildId: string) {
    try {
        const build = await prisma.build.findFirst({
            where: {
                id: buildId,
                repositoryId,
            },
            include: {
                log: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        if (!build) return null;

        return build;
    } catch (error: unknown) {
        throw new Error('Failed to get repository build logs');
    }
}

export async function updateBranchRepository(newBranch: string, repositoryId: string) {
    try {
        return await prisma.repository.update({
            where: { id: repositoryId },
            data: { branch: newBranch },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update branch repository');
    }
}

async function getRepositoryById(repositoryId: string) {
    try {
        const session = await getUserSession();

        const repository = await prisma.repository.findFirst({
            where: { id: repositoryId, userId: session?.user.id },
        });

        if (!repository) {
            throw new Error('Repository not found');
        }

        return repository;
    } catch (error: unknown) {
        throw new Error('Failed to get repository');
    }
}

async function updateRepositoryAutoDeploy(
    repositoryId: string,
    autoDeploy: boolean,
    webhookConfig?: { webhookId: string; webhookSecret: string },
) {
    try {
        return prisma.repository.update({
            where: { id: repositoryId },
            data: {
                autoDeploy,
                ...(webhookConfig && {
                    webhookId: webhookConfig.webhookId,
                    webhookSecret: webhookConfig.webhookSecret,
                }),
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update webhook repository');
    }
}

export async function deleteRepository(repositoryId: string, userId: string) {
    const repository = await getRepositoryById(repositoryId);

    const token = await getGitProviderToken(repository.gitProvider);
    const accessToken = await getValidToken(token, repository.gitProvider, userId);

    if (accessToken && repository.webhookId) {
        await tokenStorage.run({ ...token, accessToken }, async () => {
            return await removeWebhookForRepository(repositoryId);
        });
    }

    await prisma.repository.delete({
        where: { id: repositoryId },
    });
}

export async function toggleAutoDeployRepository(
    repositoryId: string,
    autoDeploy: boolean,
    userId: string,
) {
    const repository = await getRepositoryById(repositoryId);

    const token = await getGitProviderToken(repository.gitProvider);
    const accessToken = await getValidToken(token, repository.gitProvider, userId);

    if (autoDeploy && !repository.webhookId && accessToken) {
        const baseUrl = await getBaseUrl();

        const webhookConfig = await tokenStorage.run({ ...token, accessToken }, async () => {
            return await setupWebhookForRepository(
                repository.repositoryUrl,
                repository.gitProvider,
                userId,
                baseUrl,
            );
        });

        await updateRepositoryAutoDeploy(repositoryId, true, webhookConfig);
    } else if (!autoDeploy && repository.webhookId && accessToken) {
        await tokenStorage.run({ ...token, accessToken }, async () => {
            return await removeWebhookForRepository(repositoryId);
        });

        await updateRepositoryAutoDeploy(repositoryId, false);
    } else {
        await updateRepositoryAutoDeploy(repositoryId, autoDeploy);
    }

    return { success: true, autoDeploy };
}

export async function deleteWebhookForRepository(repositoryId: string) {
    try {
        return await prisma.repository.update({
            where: { id: repositoryId },
            data: {
                webhookId: null,
                webhookSecret: null,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to delete webhook for repository');
    }
}
