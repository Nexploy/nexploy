import { z } from 'zod';

export const volumeActionsSchema = z.object({
    action: z.enum(['delete', 'prune']),
    volumeNames: z.array(z.string()).min(1, 'At least one volume name is required'),
});

const driverOptSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
});

const volumeLabelSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
});

export const volumeCreateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    driver: z.string().optional(),
    driverOpts: z.array(driverOptSchema).default([]),
    labels: z.array(volumeLabelSchema).default([]),
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
