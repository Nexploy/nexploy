import { z } from 'zod';

export const updateDeploymentSchema = z.object({
    environmentId: z.string(),
    autoDeploy: z.boolean(),
});

export type UpdateDeploymentForm = z.infer<typeof updateDeploymentSchema>;
