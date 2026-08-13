import { z } from 'zod';

export const volumeRestoreQuerySchema = z.object({
    overwrite: z
        .string()
        .optional()
        .transform((v) => v === 'true'),
});

export const volumeImportSchema = z.object({
    volumeName: z
        .string()
        .min(1, 'Name is required')
        .max(255, 'Name must be at most 255 characters')
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, 'Invalid volume name'),
    overwrite: z.boolean().default(false),
});

export const volumeExportParamsSchema = z.object({
    volumeName: z.string().min(1),
});
