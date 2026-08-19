import { z } from 'zod';

export const volumeTransferStopModeSchema = z.enum(['both', 'target', 'none']);

export const volumeTransferFormSchema = z.object({
    volumeNames: z.array(z.string().min(1)).min(1, 'At least one volume is required'),
    targetEnvironmentId: z.string().min(1, 'Target environment is required'),
    overwrite: z.boolean().default(false),
    stopMode: volumeTransferStopModeSchema.default('both'),
});

export const volumeTransferApiSchema = z.object({
    volumeNames: z.array(z.string().min(1)).min(1),
    targetEnvironmentId: z.string().min(1),
    overwrite: z.boolean().default(false),
    stopMode: volumeTransferStopModeSchema.default('both'),
});

export type VolumeTransferStopMode = z.infer<typeof volumeTransferStopModeSchema>;
export type VolumeTransferForm = z.infer<typeof volumeTransferFormSchema>;
export type VolumeTransferApi = z.infer<typeof volumeTransferApiSchema>;
