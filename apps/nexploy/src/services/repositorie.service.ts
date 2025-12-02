import { RepositoryCreateForm } from '@workspace/schemas-zod/repository/repositoryCreate.schema';
import { Session } from '@/lib/auth/auth';
import { getUserSession } from '@/services/auth/auth.service';
import { prisma } from '../../prisma/prisma';

export async function createRepository(
    { repo, ...restRepositoryCreate }: RepositoryCreateForm,
    ctx: { session: Session },
) {
    try {
        const repository = await prisma.repository.create({
            data: {
                ...restRepositoryCreate,
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
        const session = await getUserSession();

        return await prisma.repository.findUnique({
            where: { id: repositoryId, userId: session?.user.id },
            include: {
                envVariables: true,
                traefikLabels: true,
                domains: true,
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

export async function getRepositorieDomains(repositoryId: string) {
    try {
        const session = await getUserSession();

        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId, userId: session?.user.id },
            include: {
                domains: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        return repository?.domains ?? [];
    } catch (error: unknown) {
        throw new Error('Failed to get repository domains');
    }
}
