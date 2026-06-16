import { z } from 'zod';

export const cleanupTargetSchema = z.enum(['images', 'volumes', 'containers', 'build', 'all']);

export type CleanupTarget = z.infer<typeof cleanupTargetSchema>;

export const cleanupTargetParamSchema = z.object({
    target: cleanupTargetSchema,
});

export const updateCleanupSettingsSchema = z.object({
    enabled: z.boolean(),
    scheduledHour: z.number().int().min(0).max(23),
    cleanImages: z.boolean(),
    cleanVolumes: z.boolean(),
    cleanContainers: z.boolean(),
    cleanBuild: z.boolean(),
});

export type UpdateCleanupSettings = z.infer<typeof updateCleanupSettingsSchema>;

export const runCleanupSchema = z.object({
    target: cleanupTargetSchema,
});

export type RunCleanupInput = z.infer<typeof runCleanupSchema>;
