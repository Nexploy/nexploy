import { z } from 'zod';

export const nodeTypeSchema = z.enum([
    'clone-repository',
    'build-docker-image',
    'deploy-container',
    'write-env-file',
    'run-script',
    'send-notification',
]);

export const pipelineNodeDataSchema = z.object({
    type: nodeTypeSchema,
    config: z.record(z.string(), z.unknown()),
    label: z.string().optional(),
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
    repositoryId: z.string().cuid(),
    graph: pipelineGraphSchema,
});

export const validatePipelineSchema = z.object({
    graph: pipelineGraphSchema,
});

export type PipelineGraphInput = z.infer<typeof pipelineGraphSchema>;
export type SavePipelineInput = z.infer<typeof savePipelineSchema>;
