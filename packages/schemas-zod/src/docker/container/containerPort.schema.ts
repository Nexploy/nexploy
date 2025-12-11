import { z } from 'zod';

export const containerPortSchema = z
    .object({
        publicPort: z
            .number()
            .int()
            .min(1)
            .max(65535, 'Le port doit être entre 1 et 65535')
            .optional()
            .nullable(),
        privatePort: z
            .number()
            .int()
            .positive()
            .min(1)
            .max(65535, 'Le port doit être entre 1 et 65535'),
        type: z.enum(['tcp', 'udp', 'sctp']).default('tcp').optional(),
    })
    .refine(
        (data) => {
            if (data.publicPort && !data.privatePort) {
                return false;
            }
            return true;
        },
        {
            message: 'Le port conteneur est requis si un port hôte est spécifié',
            path: ['privatePort'],
        },
    );

export type ContainerPortForm = z.infer<typeof containerPortSchema>;

export const currentPortSchema = z.object({
    currentContainerPort: z
        .number()
        .int()
        .min(1)
        .max(65535)
        .optional()
        .nullable(),
    currentHostPort: z.number().int().positive().min(1).max(65535),
    currentProtocol: z.enum(['tcp', 'udp', 'sctp']).optional(),
});

export const bindCurrentPort: [currentPort: typeof currentPortSchema] = [currentPortSchema];
