import { z } from 'zod';

export const dockerAgentStatusSchema = z.enum(['OFFLINE', 'ONLINE']);

export const dockerAgentIdSchema = z.object({
    agentId: z.cuid(),
});

export const createDockerAgentSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
    isDefault: z.boolean().optional(),
});

export const regenerateDockerAgentTokenSchema = z.object({
    environmentId: z.cuid(),
});

export type DockerAgentStatusType = z.infer<typeof dockerAgentStatusSchema>;
export type CreateDockerAgentInput = z.infer<typeof createDockerAgentSchema>;
export type RegenerateDockerAgentTokenInput = z.infer<typeof regenerateDockerAgentTokenSchema>;
