import { prisma } from '../../../prisma/prisma';

export function getProjectService() {
    try {
        return prisma.project.findMany();
    } catch (error: unknown) {
        throw new Error('Failed to get project');
    }
}
