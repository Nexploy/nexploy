import { z } from 'zod';

export const toggleAutoDeploySchema = z.object({
    repositoryId: z.string(),
    autoDeploy: z.boolean(),
});
