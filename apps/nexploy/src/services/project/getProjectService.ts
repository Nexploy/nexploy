import { prisma } from '../../../prisma/prisma';

export function getProjectService() {
    try {
        return prisma.project.findMany({
            include: {
                deployments: {
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
