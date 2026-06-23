import { RepositoryCreateForm } from '@workspace/schemas-zod/repository/repositoryCreate.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { Session } from '@/lib/auth/auth';
import { prisma } from '../../prisma/prisma';
import { decrypt, encrypt } from '@/lib/encryption';
import { Prisma } from 'generated/client';
import { RepositoryPayload } from '@/types/repository.type';
import { teardownRepositoryWebhook } from '@/services/webhook/repoWebhook.service';
import { verifyRepoAccessFromAccount } from '@/services/git/git.service';
import { DeleteRepositoryInput } from '@workspace/schemas-zod/repository/settings/deleteRepository.schema';
import { getFirstStage } from '@/services/repository/deploymentStage.service';
import { getDefaultEnvironment } from '@/services/environment/environment.service';

export async function createRepository(
    { repo, name, gitProvider, gitAccountId }: RepositoryCreateForm,
    ctx: { session: Session },
) {
    const t = await getErrorTranslator();
    try {
        const defaultEnvironment = await getDefaultEnvironment();

        const repository = await prisma.repository.create({
            data: {
                name,
                gitProvider,
                gitAccountId,
                gitId: repo.id,
                repositoryUrl: repo.url,
                userId: ctx.session.user.id,
                stages: {
                    create: {
                        name: 'Production',
                        isProduction: true,
                        environmentId: defaultEnvironment?.id ?? null,
                    },
                },
            },
        });

        return repository.id;
    } catch (error: unknown) {
        throw new Error(t('repository.createFailed'));
    }
}

export async function getRepositorieById<
    T extends Prisma.RepositoryInclude | undefined = undefined,
>(repositoryId: string, include?: T): Promise<RepositoryPayload<T> | null> {
    const t = await getErrorTranslator();
    try {
        return (await prisma.repository.findUnique({
            where: {
                id: repositoryId,
            },
            ...(include && { include }),
        })) as RepositoryPayload<T> | null;
    } catch (error: unknown) {
        throw new Error(t('repository.getFailed'));
    }
}

export async function getRepositories() {
    const t = await getErrorTranslator();
    try {
        return prisma.repository.findMany({
            include: {
                build: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
                gitAccount: {
                    include: {
                        gitProvider: { select: { baseUrl: true } },
                    },
                },
            },
            orderBy: {
                name: 'asc',
            },
        });
    } catch (error: unknown) {
        throw new Error(t('repository.getFailed'));
    }
}

export async function getRepositorieWithEnv(repositoryId: string) {
    const t = await getErrorTranslator();
    try {
        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId },
            include: {
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
        throw new Error(t('repository.getWithEnvFailed'));
    }
}

export async function getRepositorieBuildLogs(repositoryId: string, buildId: string) {
    const t = await getErrorTranslator();
    try {
        const build = await prisma.build.findFirst({
            where: {
                id: buildId,
                repositoryId,
            },
            include: {
                repository: {
                    select: { name: true },
                },
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
        throw new Error(t('repository.getBuildLogsFailed'));
    }
}

export async function getBuildNodeLogs(repositoryId: string, buildId: string, nodeId: string) {
    const build = await prisma.build.findFirst({
        where: { id: buildId, repositoryId },
        select: { id: true },
    });

    if (!build) return null;

    return prisma.log.findMany({
        where: { buildId, step: nodeId },
        orderBy: { createdAt: 'asc' },
    });
}

export async function getBuilds(repositoryId: string) {
    const t = await getErrorTranslator();
    try {
        return prisma.build.findMany({
            where: {
                repositoryId,
            },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error: unknown) {
        throw new Error(t('repository.getActiveBuildsFailed'));
    }
}

export async function deleteRepository(
    { repositoryId, confirmName }: DeleteRepositoryInput,
    userId: string,
) {
    const t = await getErrorTranslator();
    const repository = await prisma.repository.findUnique({
        where: { id: repositoryId },
    });

    if (!repository) {
        throw new Error(t('repository.notFound'));
    }

    if (repository.userId !== userId) {
        throw new Error(t('repository.notAuthorizedDelete'));
    }

    if (confirmName !== repository.name) {
        throw new Error(t('repository.confirmationFailed', { name: repository.name }));
    }

    await teardownRepositoryWebhook(repositoryId, userId);
    try {
        await prisma.repository.delete({
            where: { id: repositoryId, userId },
        });
    } catch (error: unknown) {
        throw new Error(t('repository.deleteFailed'));
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
    stageId?: string,
) {
    const t = await getErrorTranslator();
    try {
        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId, userId },
        });

        if (!repository) {
            throw new Error(t('repository.notFound'));
        }

        const stage = await getFirstStage(repositoryId, stageId);
        if (!stage) {
            throw new Error(t('repository.noDeploymentStage'));
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
                await tx.envVariable.upsert({
                    where: {
                        stageId_key: { stageId: stage.id, key: create.key },
                    },
                    update: {
                        value: encrypt(create.value),
                    },
                    create: {
                        key: create.key,
                        value: encrypt(create.value),
                        repositoryId,
                        stageId: stage.id,
                    },
                });
            }
        });
    } catch (error: unknown) {
        throw new Error(t('repository.updateEnvFailed'));
    }
}

export async function getRepositoryWebhookStatus(repositoryId: string) {
    const t = await getErrorTranslator();
    try {
        return prisma.repository.findUnique({
            where: { id: repositoryId },
            select: { webhookId: true },
        });
    } catch (error: unknown) {
        throw new Error(t('repository.fetchWebhookStatusFailed'));
    }
}

export async function relinkGitAccount(
    repositoryId: string,
    gitAccountId: string,
    userId: string,
    isAdmin: boolean,
) {
    const t = await getErrorTranslator();
    const repo = await prisma.repository.findUnique({
        where: { id: repositoryId },
        select: { gitId: true, repositoryUrl: true, gitProvider: true, userId: true },
    });

    if (!repo) throw new Error(t('repository.notFound'));

    if (repo.userId !== userId && !isAdmin) {
        throw new Error(t('repository.notAuthorizedRelink'));
    }

    const repoInfo = await verifyRepoAccessFromAccount(
        repo.gitProvider,
        repo.gitId,
        repo.repositoryUrl,
        gitAccountId,
        repo.userId,
    );

    await teardownRepositoryWebhook(repositoryId, repo.userId);

    await prisma.repository.update({
        where: { id: repositoryId },
        data: {
            gitAccountId,
            gitId: repoInfo.id,
            name: repoInfo.fullName,
            repositoryUrl: repoInfo.url,
        },
    });
}
