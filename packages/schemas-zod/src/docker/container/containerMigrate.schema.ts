import { z } from 'zod';

export const containerSourceActionSchema = z.enum(['stop', 'remove', 'keep']);

export const containerMigrateFormSchema = z.object({
    containerId: z.string().min(1),
    targetEnvironmentId: z.string().min(1, 'Target environment is required'),
    migrateVolumeData: z.boolean().default(false),
    sourceAction: containerSourceActionSchema.default('stop'),
    startAfterMigration: z.boolean().default(true),
    registryId: z.string().optional(),
});

const migrateAuthSchema = z.object({
    username: z.string(),
    password: z.string(),
    serveraddress: z.string().optional(),
});

export const containerMigrateApiSchema = z.object({
    containerId: z.string().min(1),
    targetEnvironmentId: z.string().min(1),
    migrateVolumeData: z.boolean().default(false),
    sourceAction: containerSourceActionSchema.default('stop'),
    startAfterMigration: z.boolean().default(true),
    auth: migrateAuthSchema.optional(),
});

export type ContainerMigrateForm = z.infer<typeof containerMigrateFormSchema>;
export type ContainerMigrateApi = z.infer<typeof containerMigrateApiSchema>;
export type ContainerSourceAction = z.infer<typeof containerSourceActionSchema>;
