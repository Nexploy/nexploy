import { z } from 'zod';

export const containerPortSchema = z.object({
    publicPort: z.number().int().positive().min(1).max(65535, 'Port must be between 1 and 65535'),
    privatePort: z.number().int().positive().min(1).max(65535, 'Port must be between 1 and 65535'),
    type: z.enum(['tcp', 'udp', 'sctp']).default('tcp').optional(),
});

export type ContainerPortForm = z.infer<typeof containerPortSchema>;

export const currentPortSchema = z.object({
    currentContainerPort: containerPortSchema.shape.publicPort,
    currentHostPort: containerPortSchema.shape.privatePort,
    currentProtocol: containerPortSchema.shape.type,
});

export const bindCurrentPort: [currentPort: typeof currentPortSchema] = [currentPortSchema];
