import { z } from 'zod';

export const containerPortSchema = (t: any) =>
    z.object({
        publicPort: z.preprocess(
            (val) => (val === '' || val === null ? undefined : val),
            z.coerce.number().min(1).max(65535, t('portRange')).optional(),
        ),
        privatePort: z.coerce
            .number()
            .min(1, t('portRange'))
            .max(65535, t('portRange')),
        type: z.enum(['tcp', 'udp', 'sctp']).default('tcp'),
    });
