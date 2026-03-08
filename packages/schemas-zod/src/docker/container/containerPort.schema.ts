import { z } from 'zod';

const portField = z
    .union([z.number().int().min(1).max(65535), z.literal('')])
    .optional()
    .transform((val) => (val === '' || val === undefined ? undefined : val));

export const containerPortSchema = z
    .object({
        publicPort: portField,
        privatePort: portField,
        type: z.enum(['tcp', 'udp', 'sctp']).default('tcp'),
    })
    .refine((data) => !(data.publicPort && !data.privatePort), {
        message: 'Container port is required if a host port is specified',
        path: ['privatePort'],
    });

export type ContainerPortForm = z.input<typeof containerPortSchema>;

export const currentPortSchema = z.object({
    currentContainerPort: z.number().int().min(1).max(65535).optional().nullable(),
    currentHostPort: z.number().int().positive().min(1).max(65535),
    currentProtocol: z.enum(['tcp', 'udp', 'sctp']).optional(),
});

export const bindCurrentPort: [currentPort: typeof currentPortSchema] = [currentPortSchema];
