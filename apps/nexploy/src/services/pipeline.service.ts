import { prisma } from '../../prisma/prisma';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { SavePipelineInput } from '@workspace/schemas-zod/pipeline/pipelineGraph.schema';
import { type NodeRunStatus } from '@workspace/typescript-interface/pipeline/pipeline';
import { decryptPipelineNodes, encryptPipelineNodes } from '@/lib/pipelineEncryption';

export interface BuildPipelineStatus {
    nodeStatuses: Record<string, NodeRunStatus>;
    nodeDurations: Record<string, number>;
    nodeStartTimes: Record<string, number>;
    status: string;
}

export async function getBuildPipelineStatus(buildId: string): Promise<BuildPipelineStatus | null> {
    const t = await getErrorTranslator();
    try {
        const build = await prisma.build.findUnique({
            where: { id: buildId },
            select: {
                nodeStatuses: true,
                nodeDurations: true,
                nodeStartTimes: true,
                status: true,
            },
        });

        if (!build) return null;

        return {
            nodeStatuses: (build.nodeStatuses as Record<string, NodeRunStatus>) ?? {},
            nodeDurations: (build.nodeDurations as Record<string, number>) ?? {},
            nodeStartTimes: (build.nodeStartTimes as Record<string, number>) ?? {},
            status: build.status,
        };
    } catch (e) {
        throw new Error(t('pipeline.getStatusFailed'));
    }
}

export async function getPipelineConfig(stageId: string): Promise<PipelineGraph | null> {
    const t = await getErrorTranslator();
    try {
        const config = await prisma.pipelineConfig.findUnique({
            where: { stageId },
        });

        if (!config) return null;

        const nodes = decryptPipelineNodes(config.nodes as unknown as PipelineGraph['nodes']);
        return {
            nodes,
            edges: config.edges as unknown as PipelineGraph['edges'],
        };
    } catch (error: unknown) {
        throw new Error(t('pipeline.getConfigFailed'));
    }
}

export async function savePipelineConfig({
    repositoryId,
    stageId,
    graph,
}: SavePipelineInput): Promise<void> {
    const t = await getErrorTranslator();
    try {
        const encryptedNodes = encryptPipelineNodes(graph.nodes);
        await prisma.pipelineConfig.upsert({
            where: { stageId },
            create: {
                repositoryId,
                stageId,
                nodes: encryptedNodes as object[],
                edges: graph.edges as object[],
            },
            update: {
                nodes: encryptedNodes as object[],
                edges: graph.edges as object[],
            },
        });
    } catch (error: unknown) {
        throw new Error(t('pipeline.saveConfigFailed'));
    }
}
