import { BuildStatus } from 'generated/client';
import { prisma } from '../../prisma/prisma';

export async function createBuild(projectId: string) {
    try {
        return await prisma.build.create({
            data: {
                projectId,
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to create deployment');
    }
}

export async function updateStatusBuild(deploymentId: string, status: BuildStatus) {
    try {
        return await prisma.build.update({
            where: { id: deploymentId },
            data: { status },
        });
    } catch (error: unknown) {
        throw new Error('Failed to update status deployment');
    }
}
