import { z } from 'zod';

export const nodeFieldRefSchema = z.object({
    nodeId: z.string(),
    inputKey: z.string(),
    nodeType: z.string().optional(),
});

export function refable<T extends z.ZodTypeAny>(schema: T) {
    return z.union([nodeFieldRefSchema, schema]);
}
