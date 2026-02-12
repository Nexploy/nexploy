import { RepositoryCreateForm } from '@workspace/schemas-zod/repository/repositoryCreate.schema';
import { Session } from '@/lib/auth/auth';
import { prisma } from '../../prisma/prisma';
import { getGitProviderToken } from '@/services/git/git.service';
import { tokenGitStorage } from '@/lib/storage/token-git-storage';
import { getUserSession } from '@/services/auth/auth.service';
import { getBaseUrl } from '@/lib/getBaseUrl';
import { getValidToken } from '@/services/api/gitProvider.service';
import {
    removeWebhookForRepository,
    setupWebhookForRepository,
} from '@/services/webhook/webhook.service';
import { decrypt, encrypt } from '@/lib/encryption';
import { BuildType, Prisma } from 'generated/client';
import { RepositoryPayload } from '@/types/repository.type';

export async function createRepository(
    { repo, ...restRepositoryCreate }: RepositoryCreateForm,
    ctx: { session: Session },
) {
    try {
        let webhookConfig = null;

        if (restRepositoryCreate.autoDeploy) {
            const oldToken = await getGitProviderToken(restRepositoryCreate.gitProvider);
            const token = await getValidToken(
                oldToken,
                restRepositoryCreate.gitProvider,
                ctx.session.user.id,
            );

            const baseUrl = await getBaseUrl();

            webhookConfig = await tokenGitStorage.run(token, async () => {
                return await setupWebhookForRepository(
                    repo.url,
                    restRepositoryCreate.gitProvider,
                    ctx.session.user.id,
                    baseUrl,
                );
            });
        }

        const repository = await prisma.repository.create({
            data: {
                ...restRepositoryCreate,
                gitId: repo.id,
                webhookId: webhookConfig?.webhookId,
                webhookSecret: webhookConfig?.webhookSecret,
                repositoryUrl: repo.url,
                userId: ctx.session.user.id,
            },
        });

        return repository.id;
    } catch (error: unknown) {
        throw new Error('Failed to create repository');
    }
}

export async function getRepositorieById<
    T extends Prisma.RepositoryInclude | undefined = undefined,
>(repositoryId: string, include?: T): Promise<RepositoryPayload<T> | null> {
    try {
        return (await prisma.repository.findUnique({
            where: {
                id: repositoryId,
            },
            ...(include && { include }),
        })) as RepositoryPayload<T> | null;
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
                environment: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get repository');
    }
}

export async function getRepositorieWithEnv(repositoryId: string) {
    try {
        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId },
            include: {
                environment: true,
                envVariables: true,
            },
        });

        if (repository) {
            repository.envVariables = repository.envVariables.map((env) => ({
                ...env,
                value: decrypt(env.value),
            }));
        }

        return repository;
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

export async function updateBuildTypeRepository(buildType: BuildType, repositoryId: string) {
    try {
        return await prisma.repository.update({
            where: { id: repositoryId },
            data: { buildType },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update build type repository');
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

    const oldToken = await getGitProviderToken(repository.gitProvider);
    const token = await getValidToken(oldToken, repository.gitProvider, userId);

    if (repository.webhookId) {
        await tokenGitStorage.run(token, async () => {
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

    const oldToken = await getGitProviderToken(repository.gitProvider);
    const token = await getValidToken(oldToken, repository.gitProvider, userId);

    if (autoDeploy && !repository.webhookId) {
        const baseUrl = await getBaseUrl();

        const webhookConfig = await tokenGitStorage.run(token, async () => {
            return await setupWebhookForRepository(
                repository.repositoryUrl,
                repository.gitProvider,
                userId,
                baseUrl,
            );
        });

        await updateRepositoryAutoDeploy(repositoryId, true, webhookConfig);
    } else if (!autoDeploy && repository.webhookId) {
        await tokenGitStorage.run(token, async () => {
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

export async function updateDeploymentSettings(
    repositoryId: string,
    settings: {
        deploymentMode: 'CONTAINER' | 'SWARM';
        replicas: number;
        updateParallelism: number;
        updateDelay: string;
        updateFailureAction: 'CONTINUE' | 'PAUSE' | 'ROLLBACK';
        updateOrder: 'STOP_FIRST' | 'START_FIRST';
        rollbackParallelism: number;
        rollbackDelay: string;
        rollbackFailureAction: 'CONTINUE' | 'PAUSE';
        restartCondition: 'NONE' | 'ON_FAILURE' | 'ANY';
        restartDelay: string;
        restartMaxAttempts: number;
        restartWindow: string;
        cpuLimit: number | null;
        cpuReservation: number | null;
        memoryLimit: string | null;
        memoryReservation: string | null;
        placementConstraints: string[];
        healthCheckEnabled: boolean;
        healthCheckCommand: string | null;
        healthCheckInterval: string;
        healthCheckTimeout: string;
        healthCheckRetries: number;
        healthCheckStartPeriod: string;
    },
    userId: string,
) {
    try {
        const repository = await prisma.repository.findFirst({
            where: { id: repositoryId, userId },
        });

        if (!repository) {
            throw new Error('Repository not found');
        }

        return await prisma.repository.update({
            where: { id: repositoryId },
            data: settings,
        });
    } catch (error: unknown) {
        throw new Error('Failed to update deployment settings');
    }
}

export async function updateEnvironmentRepository(environmentId: string, repositoryId: string) {
    try {
        return await prisma.repository.update({
            where: { id: repositoryId },
            data: { environmentId },
            include: { environment: true },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update repository environment');
    }
}

export async function updateEnvVariables(
    repositoryId: string,
    userId: string,
    data: {
        updates: { id: string; key: string; value: string }[];
        creates: { key: string; value: string }[];
        deleteIds: string[];
    },
) {
    try {
        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId, userId },
        });

        if (!repository) {
            throw new Error('Repository not found');
        }

        return await prisma.$transaction(async (tx) => {
            if (data.deleteIds.length > 0) {
                await tx.envVariable.deleteMany({
                    where: {
                        id: { in: data.deleteIds },
                        repositoryId,
                    },
                });
            }

            for (const update of data.updates) {
                await tx.envVariable.update({
                    where: { id: update.id, repositoryId },
                    data: {
                        key: update.key,
                        value: encrypt(update.value),
                    },
                });
            }

            for (const create of data.creates) {
                await tx.envVariable.create({
                    data: {
                        key: create.key,
                        value: encrypt(create.value),
                        repositoryId,
                    },
                });
            }
        });
    } catch (error: unknown) {
        throw new Error('Failed to update env variables');
    }
}
