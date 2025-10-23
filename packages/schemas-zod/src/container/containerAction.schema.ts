import { z } from 'zod';

export const ContainerActionsSchema = z.object({
    containerId: z.string(),
});
