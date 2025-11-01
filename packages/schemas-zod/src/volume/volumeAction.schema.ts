import { z } from 'zod';

export const VolumeActionsSchema = z.object({
    action: z.enum(['remove', 'prune']),
    volumeNames: z.array(z.string()).optional(),
});

export const VolumeCreateSchema = z.object({
    name: z.string().min(1),
    driver: z.string().optional(),
    driverOpts: z.record(z.string(), z.string()).optional(),
    labels: z.record(z.string(), z.string()).optional(),
});

export type VolumeActions = z.infer<typeof VolumeActionsSchema>;
export type VolumeCreate = z.infer<typeof VolumeCreateSchema>;
