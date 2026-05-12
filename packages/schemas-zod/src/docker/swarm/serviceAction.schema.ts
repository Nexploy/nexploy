import { z } from 'zod';

export const serviceIdParamSchema = z.object({
    id: z.string().min(1),
});

export const scaleServiceSchema = z.object({
    replicas: z.coerce.number().min(0, 'Replicas must be at least 0'),
});

export const scaleServiceFormSchema = z.object({
    id: z.string().min(1),
    replicas: z.coerce.number().min(0, 'Replicas must be at least 0'),
});

const servicePortSchema = z.object({
    published: z.coerce
        .number()
        .int()
        .min(1, 'Port must be at least 1')
        .max(65535, 'Port must be at most 65535'),
    target: z.coerce
        .number()
        .int()
        .min(1, 'Port must be at least 1')
        .max(65535, 'Port must be at most 65535'),
    protocol: z.enum(['tcp', 'udp']).default('tcp'),
    publishMode: z.enum(['ingress', 'host']).default('ingress'),
});

const serviceEnvVarSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string(),
});

const serviceLabelSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string(),
});

const serviceMountSchema = z.object({
    source: z.string().optional(),
    target: z.string().min(1, 'Target path is required'),
    type: z.enum(['bind', 'volume', 'tmpfs']).default('bind'),
    readOnly: z.boolean().default(false),
});

export const createServiceFormSchema = z.object({
    name: z.string().min(1, 'Service name is required'),
    image: z.string().min(1, 'Image is required'),
    mode: z.enum(['replicated', 'global']).default('replicated'),
    replicas: z.coerce.number().min(1, 'Replicas must be at least 1').default(1),
    ports: z.array(servicePortSchema).default([]),
    envVars: z.array(serviceEnvVarSchema).default([]),
    networks: z.array(z.string()).default([]),
    labels: z.array(serviceLabelSchema).default([]),
    constraints: z.array(z.string()).default([]),
    command: z.string().optional(),
    workDir: z.string().optional(),
    user: z.string().optional(),
    mounts: z.array(serviceMountSchema).default([]),
    cpuLimit: z.string().optional(),
    memoryLimit: z.string().optional(),
    cpuReservation: z.string().optional(),
    memoryReservation: z.string().optional(),
    restartCondition: z.enum(['none', 'on-failure', 'any']).optional(),
    restartMaxAttempts: z.coerce.number().int().min(0, 'Must be 0 or more').optional(),
    updateParallelism: z.coerce.number().int().min(0, 'Must be 0 or more').optional(),
    updateDelay: z.string().optional(),
    updateFailureAction: z.enum(['pause', 'continue', 'rollback']).optional(),
    updateOrder: z.enum(['stop-first', 'start-first']).optional(),
});

export const removeServicesSchema = z.object({
    serviceIds: z.array(z.string()),
});
