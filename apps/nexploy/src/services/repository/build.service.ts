import { prisma } from '../../../prisma/prisma';
import { BuildConfig, BuildLogEntry } from '@workspace/typescript-interface/repository/build';
import { addBuildJob } from '@/inngest/jobs/queue';
import { inngest } from '@/inngest/client';
import { getRepositorieWithEnv } from '@/services/repository.service';
import { setToastServer } from '@/lib/toastServer';
import { decrypt } from '@/lib/encryption';
import { StartBuildSchemaType } from '@workspace/schemas-zod/inngest/build.schema';
import { BuildStatus } from 'generated/client';
import { createLog } from '@/services/repository/log.service';
import type { Realtime } from 'inngest';
import { createBuildChannel } from '@/inngest/channels/build.channel';
import { getFirstStage } from '@/services/repository/deploymentStage.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export async function startBuildRepository(
    { repositoryId, branch, stageId }: StartBuildSchemaType,
    userId: string,
    triggerSource: 'manual' | 'webhook' = 'manual',
    triggeredByStageId?: string,
) {
    const t = await getErrorTranslator();
    const repository = await getRepositorieWithEnv(repositoryId);

    if (!repository) {
        await setToastServer({ type: 'error', message: t('build.repositoryNotFound') });
        throw new Error(t('build.repositoryNotFound'));
    }

    const stage = await getFirstStage(repository.id, stageId);
    if (!stage) {
        throw new Error(t('build.noDeploymentStage'));
    }

    await assertStageProtectionSatisfied(stage.id, stage.requiredStageId, triggeredByStageId);

    const pipelineConfig = await prisma.pipelineConfig.findUnique({
        where: { stageId: stage.id },
        select: { nodes: true, edges: true },
    });
    if (!pipelineConfig) {
        throw new Error(t('build.noPipelineConfig'));
    }

    const build = await createBuild({
        repositoryId: repository.id,
        stageId: stage.id,
        pipelineSnapshot: { nodes: pipelineConfig.nodes, edges: pipelineConfig.edges },
    });

    const config: BuildConfig = {
        userId,
        repositoryName: repository.name,
        gitBranch: branch,
        gitAccountId: repository.gitAccountId ?? undefined,
        repositoryId: repository.id,
        gitProvider: repository.gitProvider,
        gitUrl: repository.repositoryUrl,
        buildId: build.id,
        triggerSource,
        stageId: stage.id,
        environmentId: stage.environmentId ?? undefined,
    };

    await addBuildJob(build.id, config);
    return { id: build.id, numberBuild: build.number };
}

export async function removeBuild(buildId: string, organizationId: string) {
    const t = await getErrorTranslator();
    const build = await prisma.build.findUnique({
        where: { id: buildId },
        select: { repository: { select: { organizationId: true } } },
    });

    if (!build || build.repository.organizationId !== organizationId) {
        throw new Error(t('build.notFound'));
    }

    try {
        return await prisma.build.delete({ where: { id: buildId } });
    } catch {
        throw new Error(t('build.removeFailed'));
    }
}

export async function createBuild({
    repositoryId,
    stageId,
    commitMessage,
    commitHash,
    pipelineSnapshot,
}: {
    repositoryId: string;
    stageId?: string;
    environmentId?: string;
    commitMessage?: string;
    commitHash?: string;
    pipelineSnapshot?: object;
}) {
    const t = await getErrorTranslator();
    try {
        return await prisma.$transaction(async (tx) => {
            const last = await tx.build.findFirst({
                where: { repositoryId, stageId: stageId ?? null },
                orderBy: { number: 'desc' },
                select: { number: true },
            });
            return tx.build.create({
                data: {
                    repositoryId,
                    stageId,
                    number: (last?.number ?? 0) + 1,
                    commitMessage,
                    commitHash,
                    pipelineSnapshot,
                },
            });
        });
    } catch {
        throw new Error(t('build.createFailed'));
    }
}

export async function updateBuildGitInfo(
    buildId: string,
    branch: string,
    commitHash?: string,
    commitMessage?: string,
) {
    const t = await getErrorTranslator();
    try {
        await prisma.build.update({
            where: { id: buildId },
            data: { branch, commitHash, commitMessage },
        });
    } catch {
        throw new Error(t('build.updateGitInfoFailed'));
    }
}

export async function getBuildStatus(buildId: string): Promise<BuildStatus | null> {
    const t = await getErrorTranslator();
    try {
        const build = await prisma.build.findUnique({
            where: { id: buildId },
            select: { status: true },
        });
        return build?.status ?? null;
    } catch {
        throw new Error(t('build.getStatusFailed'));
    }
}

export async function updateStatusBuild(buildId: string, status: BuildStatus) {
    const t = await getErrorTranslator();
    try {
        return await prisma.build.update({ where: { id: buildId }, data: { status } });
    } catch {
        throw new Error(t('build.updateStatusFailed'));
    }
}

export async function updateNodeStatus(
    buildId: string,
    nodeId: string,
    status: string,
    buildStatus?: BuildStatus,
    durationMs?: number,
    startedAt?: number,
) {
    const t = await getErrorTranslator();
    try {
        const build = await prisma.build.findUnique({
            where: { id: buildId },
            select: { nodeStatuses: true, nodeDurations: true, nodeStartTimes: true },
        });
        const current = (build?.nodeStatuses as Record<string, string>) ?? {};
        const currentDurations = (build?.nodeDurations as Record<string, number>) ?? {};
        const currentStartTimes = (build?.nodeStartTimes as Record<string, number>) ?? {};
        await prisma.build.update({
            where: { id: buildId },
            data: {
                nodeStatuses: { ...current, [nodeId]: status },
                ...(durationMs !== undefined
                    ? { nodeDurations: { ...currentDurations, [nodeId]: durationMs } }
                    : {}),
                ...(startedAt !== undefined
                    ? { nodeStartTimes: { ...currentStartTimes, [nodeId]: startedAt } }
                    : {}),
                ...(buildStatus ? { status: buildStatus } : {}),
            },
        });
    } catch {
        throw new Error(t('build.updateNodeStatusFailed'));
    }
}

export async function cancelBuildRepository(buildId: string) {
    const t = await getErrorTranslator();
    const build = await prisma.build.findUnique({
        where: { id: buildId },
        select: { status: true, nodeStatuses: true, pipelineSnapshot: true },
    });

    if (!build) throw new Error(t('build.notFound'));
    if (build.status !== 'QUEUED' && build.status !== 'BUILDING') {
        throw new Error(t('build.cannotBeCancelled'));
    }

    const terminalStatuses = new Set(['completed', 'skipped', 'failed', 'cancelled']);
    const currentNodeStatuses = (build.nodeStatuses as Record<string, string>) ?? {};
    const snapshot = build.pipelineSnapshot as { nodes: Array<{ id: string }> } | null;

    const updatedNodeStatuses: Record<string, string> = { ...currentNodeStatuses };
    const runningNodeId = Object.entries(currentNodeStatuses).find(
        ([, status]) => status === 'running',
    )?.[0];

    if (snapshot?.nodes) {
        for (const node of snapshot.nodes) {
            const current = currentNodeStatuses[node.id];
            if (!current || !terminalStatuses.has(current)) {
                updatedNodeStatuses[node.id] = 'cancelled';
            }
        }
    }

    await prisma.build.update({
        where: { id: buildId },
        data: { status: 'CANCELLED', nodeStatuses: updatedNodeStatuses },
    });

    const now = new Date();
    const logs: BuildLogEntry[] = [
        {
            buildId,
            level: 'ERROR',
            step: 'cancel',
            message: 'Build cancelled by user',
            createdAt: now,
        },
    ];

    if (runningNodeId) {
        logs.push({
            buildId,
            level: 'ERROR',
            step: runningNodeId,
            message: 'Node interrupted: build cancelled by user',
            createdAt: now,
        });
    }

    await Promise.all(logs.map((log) => createLog(log)));

    const buildChannel = createBuildChannel(buildId);
    const publishSafe = async <T>(ref: Realtime.TopicRef<T>, data: T): Promise<void> => {
        try {
            await inngest.realtime.publish(ref, data);
        } catch {
            /* ignore */
        }
    };

    const cancelledNodeIds = Object.entries(updatedNodeStatuses)
        .filter(([, status]) => status === 'cancelled')
        .map(([nodeId]) => nodeId);

    await Promise.all([
        ...cancelledNodeIds.map((nodeId) =>
            publishSafe(buildChannel['node-status'], { nodeId, nodeStatus: 'cancelled' }),
        ),
        publishSafe(buildChannel['build-status'], { buildStatus: 'CANCELLED' }),
    ]);

    await inngest.send({ name: 'build/cancel', data: { buildId } });
}

export async function getBuildsPage(
    repositoryId: string,
    stageId?: string,
    cursor?: string,
    take = 20,
) {
    const t = await getErrorTranslator();
    try {
        return await prisma.build.findMany({
            where: { repositoryId, ...(stageId ? { stageId } : {}) },
            orderBy: { createdAt: 'desc' },
            take,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
    } catch {
        throw new Error(t('build.getPageFailed'));
    }
}

export async function assertStageProtectionSatisfied(
    stageId: string,
    requiredStageId: string | null | undefined,
    triggeredByStageId?: string,
) {
    const t = await getErrorTranslator();
    if (!requiredStageId || requiredStageId === stageId) return;
    if (triggeredByStageId && triggeredByStageId === requiredStageId) return;

    const requiredStage = await prisma.deploymentStage.findUnique({
        where: { id: requiredStageId },
        select: { name: true },
    });

    const requiredName = requiredStage?.name ?? 'another stage';
    throw new Error(t('build.stageProtected', { stage: requiredName }));
}

export async function getActiveBuilds() {
    const t = await getErrorTranslator();
    try {
        return await prisma.build.findMany({
            where: { status: { in: ['QUEUED', 'BUILDING'] } },
            select: { id: true, status: true, repository: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    } catch {
        throw new Error(t('build.getActiveBuildsFailed'));
    }
}

export async function getAllEnvsBuild(stageId: string) {
    const t = await getErrorTranslator();
    try {
        const envs = await prisma.envVariable.findMany({ where: { stageId } });
        return envs.map((env) => ({ ...env, value: decrypt(env.value) }));
    } catch {
        throw new Error(t('build.getBuildsFailed'));
    }
}
