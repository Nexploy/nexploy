import { prisma } from '../../../prisma/prisma';
import {
    DeploymentStageSchemaType,
    UpdateDeploymentStageSchemaType,
} from '@workspace/schemas-zod/repository/deploymentStage.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export async function getStagesByRepository(repositoryId: string) {
    const t = await getErrorTranslator();
    try {
        return await prisma.deploymentStage.findMany({
            where: { repositoryId },
            orderBy: { createdAt: 'asc' },
        });
    } catch {
        throw new Error(t('deploymentStage.getFailed'));
    }
}

export async function getFirstStage(repositoryId: string, stageId?: string) {
    const t = await getErrorTranslator();
    try {
        if (stageId) {
            const stage = await prisma.deploymentStage.findFirst({
                where: { id: stageId, repositoryId },
            });
            if (stage) return stage;
        }

        return await prisma.deploymentStage.findFirst({
            where: { repositoryId },
            orderBy: [{ isProduction: 'desc' }, { createdAt: 'asc' }],
        });
    } catch {
        throw new Error(t('deploymentStage.resolveFailed'));
    }
}

export async function createStage(data: DeploymentStageSchemaType) {
    const t = await getErrorTranslator();
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
                    requiredStageId: data.requiredStageId ?? null,
                },
            });
        });
    } catch {
        throw new Error(t('deploymentStage.createFailed'));
    }

    return stage;
}

export async function updateStage(data: UpdateDeploymentStageSchemaType) {
    const t = await getErrorTranslator();
    const stage = await prisma.deploymentStage.findUnique({ where: { id: data.id } });
    if (!stage) {
        throw new Error(t('deploymentStage.notFound'));
    }

    if (data.requiredStageId && data.requiredStageId === data.id) {
        throw new Error(t('deploymentStage.cannotRequireItself'));
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
                    requiredStageId: data.requiredStageId ?? null,
                },
            });
        });
    } catch {
        throw new Error(t('deploymentStage.updateFailed'));
    }
}

export async function deleteStage(id: string) {
    const t = await getErrorTranslator();
    const stage = await prisma.deploymentStage.findUnique({ where: { id } });
    if (!stage) {
        throw new Error(t('deploymentStage.notFound'));
    }

    if (stage.isProduction) {
        throw new Error(t('deploymentStage.cannotDeleteProduction'));
    }

    const count = await prisma.deploymentStage.count({
        where: { repositoryId: stage.repositoryId },
    });
    if (count <= 1) {
        throw new Error(t('deploymentStage.cannotDeleteLast'));
    }

    try {
        await prisma.deploymentStage.delete({ where: { id } });
    } catch {
        throw new Error(t('deploymentStage.deleteFailed'));
    }
}
