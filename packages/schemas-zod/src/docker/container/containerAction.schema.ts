import { z } from 'zod';

export const containerActionsSchema = z.object({
    containerId: z.string(),
});

export const containerParamSchema = z.object({
    id: z.string().min(1),
});

export type ContainerParamType = z.infer<typeof containerParamSchema>;
