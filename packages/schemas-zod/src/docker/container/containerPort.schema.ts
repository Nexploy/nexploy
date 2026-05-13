import { z } from 'zod';

export const containerPortSchema = z.object({
    publicPort: z.preprocess(
        (val) => (val === '' || val === null ? undefined : val),
        z.coerce.number().min(1).max(65535, 'Public Port must be between 1 and 65535').optional(),
    ),
    privatePort: z.coerce
        .number()
        .min(1, 'Private Port must be between 1 and 65535')
        .max(65535, 'Private Port must be between 1 and 65535'),
    type: z.enum(['tcp', 'udp', 'sctp']).default('tcp'),
});
