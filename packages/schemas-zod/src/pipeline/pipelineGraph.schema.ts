import { z } from 'zod';

export const nodeTypeSchema = z.enum([
    'clone-repository',
    'build-docker-image',
    'deploy-container',
    'deploy-compose',
    'push-to-registry',
    'validate-dockerfile',
    'validate-compose',
    'write-env-file',
    'set-env-vars',
    'clean-workdir',
    'send-notification',
    'save-version',
]);

export const pipelineNodeDataSchema = z.object({
    type: nodeTypeSchema,
    config: z.record(z.string(), z.unknown()),
    label: z.string().optional(),
    disabled: z.boolean().optional(),
    isStartNode: z.boolean().optional(),
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
    graph: pipelineGraphSchema,
});

export type SavePipelineInput = z.infer<typeof savePipelineSchema>;

export const saveNodeConfigBindArgsSchemas = [z.cuid(), z.string()] as const;
export const saveNodeConfigInputSchema = z.record(z.string(), z.unknown());
