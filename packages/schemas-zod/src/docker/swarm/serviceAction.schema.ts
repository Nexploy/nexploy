import { z } from 'zod';

export const serviceIdParamSchema = z.object({
    id: z.string().min(1),
});

export const scaleServiceSchema = z.object({
    replicas: z.number().int().min(0),
});

export const createServiceSchema = z.object({
    name: z.string().min(1),
    image: z.string().min(1),
    mode: z.enum(['replicated', 'global']).optional().default('replicated'),
    replicas: z.number().int().min(1).optional().default(1),
    ports: z
        .array(
            z.object({
                published: z.number().int().min(1).max(65535),
                target: z.number().int().min(1).max(65535),
                protocol: z.enum(['tcp', 'udp']).optional().default('tcp'),
            }),
        )
        .optional(),
    env: z.array(z.string()).optional(),
    networks: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
    labels: z.record(z.string(), z.string()).optional(),
    command: z.array(z.string()).optional(),
});

export const removeServiceSchema = z.object({
    force: z.boolean().optional().default(false),
});
