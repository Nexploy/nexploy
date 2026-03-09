import { prisma } from '../../prisma/prisma';
import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { SavePipelineInput } from '@workspace/schemas-zod/pipeline/pipelineGraph.schema';
import { type NodeRunStatus } from '@/types/pipeline.type';

export interface BuildPipelineStatus {
    nodeStatuses: Record<string, NodeRunStatus>;
    status: string;
}

export async function getBuildPipelineStatus(buildId: string): Promise<BuildPipelineStatus | null> {
    try {
        const build = await prisma.build.findUnique({
            where: { id: buildId },
            select: { nodeStatuses: true, status: true },
        });

        if (!build) return null;

        return {
            nodeStatuses: (build.nodeStatuses as Record<string, NodeRunStatus>) ?? {},
            status: build.status,
        };
    } catch (e) {
        throw new Error('Failed to get build pipeline status');
    }
}

export async function getPipelineConfig(repositoryId: string): Promise<PipelineGraph | null> {
    try {
        const config = await prisma.pipelineConfig.findUnique({
            where: { repositoryId },
        });

        if (!config) return null;

        return {
            nodes: config.nodes as unknown as PipelineGraph['nodes'],
            edges: config.edges as unknown as PipelineGraph['edges'],
        };
    } catch (error: unknown) {
        throw new Error('Failed to get pipeline config');
    }
}

export async function savePipelineConfig({
    repositoryId,
    graph,
}: SavePipelineInput): Promise<void> {
    try {
        await prisma.pipelineConfig.upsert({
            where: { repositoryId },
            create: {
                repositoryId,
                nodes: graph.nodes as object[],
                edges: graph.edges as object[],
            },
            update: {
                nodes: graph.nodes as object[],
                edges: graph.edges as object[],
            },
        });
    } catch (error: unknown) {
        throw new Error('Failed to save pipeline config');
    }
}
