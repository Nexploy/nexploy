import { z } from 'zod';

const envVariableItemSchema = z.object({
    id: z.string().optional(),
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
});

export const envVariableSchema = z.object({
    repositoryId: z.string(),
    stageId: z.string().optional(),
    envVariables: z.array(envVariableItemSchema),
    deleteIds: z.array(z.string()),
});
