import { prisma } from '../../../prisma/prisma';
import {
    DeploymentStageSchemaType,
    UpdateDeploymentStageSchemaType,
} from '@workspace/schemas-zod/repository/deploymentStage.schema';
import {
    generateTraefikConfigForRepository,
    getDomainsFromTraefikConfig,
} from '@/services/traefik.service';

export async function getStagesByRepository(repositoryId: string) {
    try {
        return await prisma.deploymentStage.findMany({
            where: { repositoryId },
            orderBy: { createdAt: 'asc' },
        });
    } catch {
        throw new Error('Failed to get deployment stages');
    }
}

export async function getFirstStage(repositoryId: string, stageId?: string) {
    try {
        return await prisma.deploymentStage.findFirst({
            where: { id: stageId, repositoryId },
        });
    } catch {
        throw new Error('Failed to resolve deployment stage');
    }
}

export async function createStage(data: DeploymentStageSchemaType) {
    let stage;
    try {
        stage = await prisma.$transaction(async (tx) => {
            if (data.isProduction) {
                await tx.deploymentStage.updateMany({
                    where: { repositoryId: data.repositoryId, isProduction: true },
                    data: { isProduction: false },
                });
            }
            return tx.deploymentStage.create({
                data: {
                    repositoryId: data.repositoryId,
                    name: data.name,
                    isProduction: data.isProduction ?? false,
                    environmentId: data.environmentId ?? null,
                },
            });
        });
    } catch {
        throw new Error('Failed to create deployment stage');
    }

    return stage;
}

export async function updateStage(data: UpdateDeploymentStageSchemaType) {
    const stage = await prisma.deploymentStage.findUnique({ where: { id: data.id } });
    if (!stage) {
        throw new Error('Deployment stage not found');
    }

    try {
        return await prisma.$transaction(async (tx) => {
            if (data.isProduction) {
                await tx.deploymentStage.updateMany({
                    where: {
                        repositoryId: stage.repositoryId,
                        isProduction: true,
                        id: { not: data.id },
                    },
                    data: { isProduction: false },
                });
            }
            return tx.deploymentStage.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    isProduction: data.isProduction ?? stage.isProduction,
                    environmentId: data.environmentId ?? null,
                },
            });
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

    if (stage.isProduction) {
        throw new Error('Cannot delete the production deployment stage');
    }

    const count = await prisma.deploymentStage.count({
        where: { repositoryId: stage.repositoryId },
    });
    if (count <= 1) {
        throw new Error('Cannot delete the last deployment stage');
    }

    try {
        const domains = await getDomainsFromTraefikConfig(stage.repositoryId);
        const remaining = domains.filter((d) => d.stageId !== id);
        if (remaining.length !== domains.length) {
            await generateTraefikConfigForRepository(stage.repositoryId, remaining);
        }
    } catch {}

    try {
        await prisma.deploymentStage.delete({ where: { id } });
    } catch {
        throw new Error('Failed to delete deployment stage');
    }
}
