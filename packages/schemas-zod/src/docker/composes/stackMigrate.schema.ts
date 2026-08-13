import { z } from 'zod';
import { containerSourceActionSchema } from '../container/containerMigrate.schema';

export const stackMigrateFormSchema = z.object({
    stackName: z.string().min(1),
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

export const stackMigrateApiSchema = z.object({
    stackName: z.string().min(1),
    targetEnvironmentId: z.string().min(1),
    migrateVolumeData: z.boolean().default(false),
    sourceAction: containerSourceActionSchema.default('stop'),
    startAfterMigration: z.boolean().default(true),
    auth: migrateAuthSchema.optional(),
});

export type StackMigrateForm = z.infer<typeof stackMigrateFormSchema>;
export type StackMigrateApi = z.infer<typeof stackMigrateApiSchema>;
