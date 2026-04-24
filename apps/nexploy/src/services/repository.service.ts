import { RepositoryCreateForm } from '@workspace/schemas-zod/repository/repositoryCreate.schema';
import { Session } from '@/lib/auth/auth';
import { prisma } from '../../prisma/prisma';
import { getUserSession } from '@/services/auth/auth.service';
import { decrypt, encrypt } from '@/lib/encryption';
import { Prisma } from 'generated/client';
import { RepositoryPayload } from '@/types/repository.type';

export async function createRepository(
    { repo, name, gitProvider, gitAccountId }: RepositoryCreateForm,
    ctx: { session: Session },
) {
    try {
        const repository = await prisma.repository.create({
            data: {
                name,
                gitProvider,
                gitAccountId,
                gitId: repo.id,
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
        throw new Error('Failed to get repository');
    }
}

export async function getRepositorieWithEnv(repositoryId: string) {
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
        throw new Error('Failed to get repository build logs');
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
    try {
        return prisma.build.findMany({
            where: {
                repositoryId,
            },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get active builds');
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

export async function deleteRepository(repositoryId: string) {
    await getRepositoryById(repositoryId);

    await prisma.repository.delete({
        where: { id: repositoryId },
    });
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
                await tx.envVariable.upsert({
                    where: {
                        repositoryId_key: { repositoryId, key: create.key },
                    },
                    update: {
                        value: encrypt(create.value),
                    },
                    create: {
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
