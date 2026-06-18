import { z } from 'zod';

export const deploymentStageSchema = z.object({
    id: z.cuid().optional(),
    repositoryId: z.cuid(),
    name: z.string().min(1, 'Name is required'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
    isProduction: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
    environmentId: z.cuid().nullish(),
});

export const updateDeploymentStageSchema = deploymentStageSchema.extend({
    id: z.cuid(),
});

export const deleteDeploymentStageSchema = z.object({
    id: z.cuid(),
});

export type DeploymentStageSchemaType = z.infer<typeof deploymentStageSchema>;
export type UpdateDeploymentStageSchemaType = z.infer<typeof updateDeploymentStageSchema>;
