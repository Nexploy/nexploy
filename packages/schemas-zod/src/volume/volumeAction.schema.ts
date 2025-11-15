import { z } from 'zod';

export const volumeActionsSchema = z.object({
    action: z.enum(['delete', 'prune']),
    volumeNames: z.array(z.string()).optional(),
});

export const volumeCreateSchema = z.object({
    name: z.string().min(1),
    driver: z.string().optional(),
    driverOpts: z.record(z.string(), z.string()).optional(),
    labels: z.record(z.string(), z.string()).optional(),
});

export type VolumeActions = z.infer<typeof volumeActionsSchema>;
export type VolumeCreate = z.infer<typeof volumeCreateSchema>;
