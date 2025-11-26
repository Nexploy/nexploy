import { prisma } from '../../../prisma/prisma';

export async function getProjectByIdService(projectId: string) {
    try {
        const project = await prisma.project.findUnique({
            where: {
                id: projectId,
            },
            include: {
                deployments: {
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
