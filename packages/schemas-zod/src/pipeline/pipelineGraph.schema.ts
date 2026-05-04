import { z } from 'zod';

export const nodeTypeSchema = z.enum([
    'clone-repository',
    'webhook-clone',
    'build-docker-image',
    'deploy-compose',
    'push-to-registry',
    'pull-from-registry',
    'validate-dockerfile',
    'validate-compose',
    'env-vars',
    'set-env-vars',
    'clean-workdir',
    'send-notification',
    'save-version',
    'set-environment',
    'create-container',
    'start-container',
    'stop-container',
    'restart-container',
    'remove-container',
    'create-network',
    'create-volume',
    // Flow Control
    'wait-for-health',
    'wait-for-url',
    'wait-for-port',
    'delay',
    'condition',
    // Script Execution
    'run-script',
    'run-command-in-container',
    'run-tests',
    // HTTP / Webhooks
    'http-request',
    'update-commit-status',
    // Image Management
    'tag-image',
    'scan-image',
    'prune-images',
    'delete-image',
    'delete-network',
    'delete-volume',
    // Files & Artifacts
    'template-file',
    'upload-artifact',
    'download-file',
    // Database
    'run-migration',
    'backup-volume-s3',
    // Docker Swarm
    'update-service',
    'scale-service',
    // Monitoring
    'check-container-logs',
    // Cache
    'cache-restore',
    'cache-save',
    // Git
    'git-tag',
    'git-clone-extra',
    'create-release',
    'cherry-pick-commit',
    'merge-branch',
    'generate-changelog',
    // Secrets
    'fetch-secrets-vault',
    'fetch-secrets-doppler',
    // Code Quality
    'sonarqube-scan',
]);

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
    graph: pipelineGraphSchema,
});

export type SavePipelineInput = z.infer<typeof savePipelineSchema>;

export const saveNodeConfigBindArgsSchemas = [z.cuid(), z.string()] as const;
export const saveNodeConfigInputSchema = z.record(z.string(), z.unknown());
