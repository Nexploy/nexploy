import { prisma } from '../../../prisma/prisma';
import {
    DeploymentStageSchemaType,
    UpdateDeploymentStageSchemaType,
} from '@workspace/schemas-zod/repository/deploymentStage.schema';

export async function getStagesByRepository(repositoryId: string) {
    try {
        return await prisma.deploymentStage.findMany({
            where: { repositoryId },
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        });
    } catch {
        throw new Error('Failed to get deployment stages');
    }
}

export async function getStageById(id: string) {
    try {
        return await prisma.deploymentStage.findUnique({ where: { id } });
    } catch {
        throw new Error('Failed to get deployment stage');
    }
}

/**
 * Resolve the stage to build/deploy against. Falls back to the production
 * stage, then to the first stage, when no explicit stage is provided.
 */
export async function resolveStage(repositoryId: string, stageId?: string) {
    if (stageId) {
        const stage = await prisma.deploymentStage.findFirst({
            where: { id: stageId, repositoryId },
        });
        if (stage) return stage;
    }

    return prisma.deploymentStage.findFirst({
        where: { repositoryId },
        orderBy: [{ isProduction: 'desc' }, { order: 'asc' }, { createdAt: 'asc' }],
    });
}

export async function createStage(data: DeploymentStageSchemaType) {
    try {
        const last = await prisma.deploymentStage.findFirst({
            where: { repositoryId: data.repositoryId },
            orderBy: { order: 'desc' },
            select: { order: true },
        });

        return await prisma.deploymentStage.create({
            data: {
                repositoryId: data.repositoryId,
                name: data.name,
                slug: data.slug,
                isProduction: data.isProduction ?? false,
                order: data.order ?? (last?.order ?? -1) + 1,
                environmentId: data.environmentId ?? null,
            },
        });
    } catch {
        throw new Error('Failed to create deployment stage');
    }
}

export async function updateStage(data: UpdateDeploymentStageSchemaType) {
    const stage = await prisma.deploymentStage.findUnique({ where: { id: data.id } });
    if (!stage) {
        throw new Error('Deployment stage not found');
    }

    try {
        return await prisma.deploymentStage.update({
            where: { id: data.id },
            data: {
                name: data.name,
                slug: data.slug,
                isProduction: data.isProduction ?? stage.isProduction,
                order: data.order ?? stage.order,
                environmentId: data.environmentId ?? null,
            },
        });
    } catch {
        throw new Error('Failed to update deployment stage');
    }
}

export async function deleteStage(id: string) {
    const stage = await prisma.deploymentStage.findUnique({ where: { id } });
    if (!stage) {
        throw new Error('Deployment stage not found');
    }

    const count = await prisma.deploymentStage.count({
        where: { repositoryId: stage.repositoryId },
    });
    if (count <= 1) {
        throw new Error('Cannot delete the last deployment stage');
    }

    try {
        await prisma.deploymentStage.delete({ where: { id } });
    } catch {
        throw new Error('Failed to delete deployment stage');
    }
}
