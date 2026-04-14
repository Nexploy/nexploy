import { z } from 'zod';

export const nodeFieldRefSchema = z.object({
    nodeId: z.string(),
    inputKey: z.string(),
    nodeType: z.string().optional(),
});

export type NodeFieldRefSchema = typeof nodeFieldRefSchema;
