import { z } from 'zod';

export const envVariableSchema = z.object({
    repositoryId: z.string(),
    updates: z.array(
        z.object({
            id: z.string(),
            key: z.string().min(1),
            value: z.string(),
        }),
    ),
    creates: z.array(
        z.object({
            key: z.string().min(1),
            value: z.string(),
        }),
    ),
    deleteIds: z.array(z.string()),
});
