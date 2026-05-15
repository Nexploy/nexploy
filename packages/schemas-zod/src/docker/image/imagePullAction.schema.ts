import { z } from 'zod';

export const imagePullSchema = (t: any) =>
    z.object({
        imageName: z.string().min(1, t('fieldRequired', { field: t('fieldNames.imageName') })),
        registryId: z.string().optional(),
    });
