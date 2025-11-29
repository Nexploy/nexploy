import { ProjectCreateForm } from '@workspace/schemas-zod/project/projectCreate.schema';
import { Session } from '@/lib/auth/auth';
import { getUserSession } from '@/services/auth/auth.service';
import { prisma } from '../../prisma/prisma';

export async function createProjectService(
    { repo, ...restProjectCreate }: ProjectCreateForm,
    ctx: { session: Session },
) {
    try {
        const project = await prisma.project.create({
            data: {
                ...restProjectCreate,
                repositoryUrl: repo.url,
                userId: ctx.session.user.id,
            },
        });

        return project.id;
    } catch (error: unknown) {
        throw new Error('Failed to create project');
    }
}

export async function getProjectByIdService(projectId: string) {
    try {
        const project = await prisma.project.findUnique({
            where: {
                id: projectId,
            },
            include: {
                build: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 10,
                },
                envVariables: {
                    orderBy: {
                        key: 'asc',
                    },
                },
            },
        });

        if (!project) {
            return null;
        }

        return project;
    } catch (error: unknown) {
        console.error('Error getting project by id:', error);
        throw new Error('Failed to get project');
    }
}

export function getProjectService() {
    try {
        return prisma.project.findMany({
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
        throw new Error('Failed to get project');
    }
}

export async function getProjectWithEnv(projectId: string) {
    try {
        const session = await getUserSession();

        return await prisma.project.findUnique({
            where: { id: projectId, userId: session?.user.id },
            include: {
                envVariables: true,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to get project with env');
    }
}
