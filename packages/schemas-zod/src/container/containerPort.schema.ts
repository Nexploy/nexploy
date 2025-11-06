import { z } from 'zod';

export const containerPortSchema = z.object({
    containerId: z.string(),
    containerPort: z
        .number()
        .int()
        .positive()
        .min(1)
        .max(65535, 'Port must be between 1 and 65535'),
    hostPort: z.number().int().positive().min(1).max(65535, 'Port must be between 1 and 65535'),
    protocol: z.enum(['tcp', 'udp', 'sctp']).default('tcp').optional(),
});

export type ContainerPortForm = z.infer<typeof containerPortSchema>;

export const currentPortSchema = z.object({
    currentContainerPort: containerPortSchema.shape.containerPort,
    currentHostPort: containerPortSchema.shape.hostPort,
    currentProtocol: containerPortSchema.shape.protocol,
});

export const bindCurrentPort: [currentPort: typeof currentPortSchema] = [currentPortSchema];
