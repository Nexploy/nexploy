import { z } from 'zod';

export const deploymentStageSchema = z.object({
    id: z.cuid().optional(),
    repositoryId: z.cuid(),
    name: z.string().min(1, 'Name is required'),
    isProduction: z.boolean().optional(),
    environmentId: z.cuid('An environment is required'),
});

export const updateDeploymentStageSchema = deploymentStageSchema.extend({
    id: z.cuid(),
});

export const deleteDeploymentStageSchema = z.object({
    id: z.cuid(),
});

export type DeploymentStageSchemaType = z.infer<typeof deploymentStageSchema>;
export type UpdateDeploymentStageSchemaType = z.infer<typeof updateDeploymentStageSchema>;
