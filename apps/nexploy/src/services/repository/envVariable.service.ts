import { prisma } from '../../../prisma/prisma';
import { encrypt } from '@/lib/encryption';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { getFirstStage } from '@/services/repository/deploymentStage.service';
import { EnvVariableSchemaType } from '@workspace/schemas-zod/repository/envVariable.schema';

export async function updateEnvVariables(
    repositoryId: string,
    data: {
        updates: { id: string; key: string; value: string }[];
        creates: { key: string; value: string }[];
        deleteIds: string[];
    },
    stageId?: string,
) {
    const t = await getErrorTranslator();
    try {
        const repository = await prisma.repository.findUnique({
            where: { id: repositoryId },
        });

        if (!repository) {
            throw new Error(t('repository.notFound'));
        }

        const stage = await getFirstStage(repositoryId, stageId);
        if (!stage) {
            throw new Error(t('repository.noDeploymentStage'));
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
                        stageId_key: { stageId: stage.id, key: create.key },
                    },
                    update: {
                        value: encrypt(create.value),
                    },
                    create: {
                        key: create.key,
                        value: encrypt(create.value),
                        repositoryId,
                        stageId: stage.id,
                    },
                });
            }
        });
    } catch {
        throw new Error(t('repository.updateEnvFailed'));
    }
}

export async function saveEnvVariables({ repositoryId, stageId, envVariables, deleteIds }: EnvVariableSchemaType) {
    const updates = envVariables
        .filter((env) => env.id && !deleteIds.includes(env.id))
        .map((env) => ({
            id: env.id!,
            key: env.key,
            value: env.value,
        }));

    const creates = envVariables
        .filter((env) => !env.id)
        .map((env) => ({
            key: env.key,
            value: env.value,
        }));

    return updateEnvVariables(repositoryId, { updates, creates, deleteIds }, stageId);
}

export async function deleteEnvVariable(repositoryId: string, envVariableId: string) {
    return updateEnvVariables(repositoryId, {
        updates: [],
        creates: [],
        deleteIds: [envVariableId],
    });
}
