import { RepositoryCreateForm } from '@workspace/schemas-zod/repository/repositoryCreate.schema';
import { Session } from '@/lib/auth/auth';
import { prisma } from '../../prisma/prisma';
import { setupWebhookForRepository } from '@/services/webhook.service';
import { headers } from 'next/headers';
import { WebhookConfig } from '@workspace/schemas-zod/repository/webhook.schema';
import { getGitProviderToken } from '@/services/git/git.service';
import { gitProviderService } from '@/services/api/gitProvider.service';

export async function createRepository(
    { repo, ...restRepositoryCreate }: RepositoryCreateForm,
    ctx: { session: Session },
) {
    try {
        let webhookValues: WebhookConfig | null = null;

        if (restRepositoryCreate.autoDeploy) {
            const token = await getGitProviderToken(restRepositoryCreate.gitProvider);
            const accessToken = await gitProviderService.getValidToken(
                token,
                restRepositoryCreate.gitProvider,
                ctx.session.user.id,
            );

            if (accessToken) {
                const headersList = await headers();
                const host = headersList.get('host') || 'localhost:3000';
                const protocol = headersList.get('x-forwarded-proto') || 'http';
                const baseUrl = `${protocol}://${host}`;

                webhookValues = await setupWebhookForRepository(
                    repo.url,
                    restRepositoryCreate.gitProvider,
                    accessToken,
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
