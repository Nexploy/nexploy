import { z } from 'zod';

export const nodeIdParamSchema = z.object({
    id: z.string().min(1),
});

export const swarmNodeActionSchema = z.object({
    nodeId: z.string().min(1),
    action: z.enum(['promote', 'demote', 'drain', 'activate', 'pause', 'remove']),
    force: z.boolean().optional(),
});

export const nodeDeleteBodySchema = z.object({
    force: z.boolean().optional(),
});

export type SwarmNodeActionInput = z.infer<typeof swarmNodeActionSchema>;
