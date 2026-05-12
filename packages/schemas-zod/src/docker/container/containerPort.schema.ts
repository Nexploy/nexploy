import { z } from 'zod';

export const containerPortSchema = z.object({
    publicPort: z.coerce
        .number()
        .min(1, 'Public Port must be between 1 and 65535')
        .max(65535, 'Public Port must be between 1 and 65535'),
    privatePort: z.coerce
        .number()
        .min(1, 'Private Port must be between 1 and 65535')
        .max(65535, 'Private Port must be between 1 and 65535'),
    type: z.enum(['tcp', 'udp', 'sctp']).default('tcp'),
});

export type ContainerPortForm = z.infer<typeof containerPortSchema>;
