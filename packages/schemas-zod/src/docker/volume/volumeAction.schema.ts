import { z } from 'zod';

export const volumeActionsSchema = z.object({
    action: z.enum(['delete', 'prune']),
    volumeNames: z.array(z.string()).min(1, 'At least one volume name is required'),
});

const driverOptSchema = (t: any) =>
    z.object({
        key: z.string().min(1, t('fieldRequired', { field: t('fieldNames.key') })),
        value: z.string().min(1, t('fieldRequired', { field: t('fieldNames.value') })),
    });

const volumeLabelSchema = (t: any) =>
    z.object({
        key: z.string().min(1, t('fieldRequired', { field: t('fieldNames.key') })),
        value: z.string().min(1, t('fieldRequired', { field: t('fieldNames.value') })),
    });

export const volumeCreateSchema = (t: any) =>
    z.object({
        name: z.string().min(1, t('fieldRequired', { field: t('fieldNames.name') })),
        driver: z.string().optional(),
        driverOpts: z.array(driverOptSchema(t)).default([]),
        labels: z.array(volumeLabelSchema(t)).default([]),
    });

export const volumeDeleteSchema = z.object({
    volumeNames: z.array(z.string()).min(1, 'At least one volume name is required'),
});

export const volumeNameParamSchema = z.object({
    name: z.string().min(1),
});

export const volumeDeleteQuerySchema = z.object({
    force: z
        .string()
        .optional()
        .transform((v) => v === 'true'),
});
