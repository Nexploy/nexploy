import { z } from 'zod';

export const volumeActionsSchema = z.object({
    action: z.enum(['delete', 'prune']),
    volumeNames: z.array(z.string()),
});

export const volumeCreateSchema = z.object({
    name: z.string().min(1),
    driver: z.string().optional(),
    driverOpts: z.record(z.string(), z.string()).optional(),
    labels: z.record(z.string(), z.string()).optional(),
});

export const volumeDeleteSchema = z.object({
    volumeNames: z.array(z.string()).min(1),
});

export const volumeNameParamSchema = z.object({
    name: z.string().min(1),
});

export const volumeDeleteQuerySchema = z.object({
    force: z.string().optional().transform((v) => v === 'true'),
});

const cacheKeySchema = z.string().regex(/^[\w\-]+$/).optional();

export const cacheRestoreSchema = z.object({
    volumeName: z.string().min(1),
    cachePath: z.string().min(1),
    workDir: z.string().min(1),
    cacheKey: cacheKeySchema,
});

export const cacheSaveSchema = z.object({
    volumeName: z.string().min(1),
    sourcePath: z.string().min(1),
    workDir: z.string().min(1),
    cacheKey: cacheKeySchema,
});

export type VolumeActions = z.infer<typeof volumeActionsSchema>;
export type VolumeCreate = z.infer<typeof volumeCreateSchema>;
