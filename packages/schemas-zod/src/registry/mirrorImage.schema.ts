import { z } from 'zod';

export const mirrorImageSchema = (t: any) =>
    z.object({
        sourceImage: z.string().min(1, t('fieldRequired', { field: t('fieldNames.sourceImage') })),
        targetRegistryId: z.string().min(1, t('fieldRequired', { field: t('fieldNames.targetRegistry') })),
        sourceUsername: z.string().optional(),
        sourcePassword: z.string().optional(),
    });

export type MirrorImageInput = z.infer<ReturnType<typeof mirrorImageSchema>>;
