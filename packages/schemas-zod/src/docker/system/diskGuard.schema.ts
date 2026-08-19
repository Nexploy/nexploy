import { z } from 'zod';

export const diskGuardSettingsSchema = z
    .object({
        enabled: z.boolean(),
        warnPercent: z.number().int().min(1).max(99),
        blockPercent: z.number().int().min(1).max(99),
        minFreeMb: z.number().int().min(0).max(1_048_576),
    })
    .refine((value) => value.warnPercent < value.blockPercent, {
        path: ['warnPercent'],
        message: 'warnPercent must be lower than blockPercent',
    });

export type UpdateDiskGuardSettings = z.infer<typeof diskGuardSettingsSchema>;
