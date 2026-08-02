import { z } from 'zod';

export const nodeTypeSchema = z.string().min(1);

export const pipelineNodeDataSchema = z.object({
    type: nodeTypeSchema,
    config: z.record(z.string(), z.unknown()),
    label: z.string().optional(),
    disabled: z.boolean().optional(),
    isStartNode: z.boolean().optional(),
    isEndNode: z.boolean().optional(),
});

export const pipelineNodeSchema = z.object({
    id: z.string(),
    type: nodeTypeSchema,
    position: z.object({ x: z.number(), y: z.number() }),
    data: pipelineNodeDataSchema,
});

export const pipelineEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    sourceHandle: z.string().optional(),
    target: z.string(),
    targetHandle: z.string().optional(),
});

export const pipelineGraphSchema = z.object({
    nodes: z.array(pipelineNodeSchema),
    edges: z.array(pipelineEdgeSchema),
});

export const savePipelineSchema = z.object({
    repositoryId: z.cuid(),
    stageId: z.cuid(),
    graph: pipelineGraphSchema,
});

export type SavePipelineInput = z.infer<typeof savePipelineSchema>;

// [repositoryId, stageId, nodeId]
export const saveNodeConfigBindArgsSchemas = [z.cuid(), z.cuid(), z.string()] as const;
export const saveNodeConfigInputSchema = z.record(z.string(), z.unknown());

export const analyzeRepositorySchema = z.object({
    repositoryId: z.string().min(1).describe('The ID of the repository to analyze'),
    branch: z.string().optional().describe('Branch to read from (defaults to HEAD)'),
});

export const savePipelineMcpSchema = z.object({
    repositoryId: z.string().min(1).describe('The ID of the repository'),
    stageId: z.string().optional().describe('Deployment stage ID (defaults to the production stage)'),
    nodes: z.array(pipelineNodeSchema).describe('Pipeline nodes'),
    edges: z.array(pipelineEdgeSchema).describe('Pipeline edges connecting nodes'),
});
