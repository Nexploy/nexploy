import { z } from 'zod';

const cacheKeySchema = z
    .string()
    .regex(/^[\w\-]+$/)
    .optional();

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
