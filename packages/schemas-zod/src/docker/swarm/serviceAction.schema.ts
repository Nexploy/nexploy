import { z } from 'zod';

export const serviceIdParamSchema = z.object({
    id: z.string().min(1),
});

export const scaleServiceSchema = z.object({
    replicas: z.coerce.number().min(0, 'Replicas must be at least 0'),
});

export const scaleServiceFormSchema = z.object({
    id: z.string().min(1),
    replicas: z.coerce.number().min(0, 'Must be at least 0'),
});

const servicePortSchema = z.object({
    published: z.coerce.number().int().min(1, 'Port must be between 1 and 65535').max(65535, 'Port must be between 1 and 65535'),
    target: z.coerce.number().int().min(1, 'Port must be between 1 and 65535').max(65535, 'Port must be between 1 and 65535'),
    protocol: z.enum(['tcp', 'udp']).default('tcp'),
    publishMode: z.enum(['ingress', 'host']).default('ingress'),
});

const serviceEnvVarSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
});

const serviceLabelSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
});

const serviceMountSchema = z.object({
    source: z.string().min(1, 'Source is required'),
    target: z.string().min(1, 'Target is required'),
    type: z.enum(['bind', 'volume', 'tmpfs']).default('bind'),
    readOnly: z.boolean().default(false),
});

export const createServiceFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    image: z.string().min(1, 'Image is required'),
    mode: z.enum(['replicated', 'global']).default('replicated'),
    replicas: z.coerce.number().min(1, 'Must be at least 1').default(1),
    ports: z.array(servicePortSchema).default([]),
    envVars: z.array(serviceEnvVarSchema).default([]),
    networks: z.array(z.string().min(1, 'Network is required')).default([]),
    labels: z.array(serviceLabelSchema).default([]),
    constraints: z.array(z.string().min(1, 'Constraint is required')).default([]),
    command: z.string().optional(),
    workDir: z.string().optional(),
    user: z.string().optional(),
    mounts: z.array(serviceMountSchema).default([]),
    cpuLimit: z.string().optional(),
    memoryLimit: z.string().optional(),
    cpuReservation: z.string().optional(),
    memoryReservation: z.string().optional(),
    restartCondition: z.enum(['none', 'on-failure', 'any']).default('any'),
    restartMaxAttempts: z.coerce.number().int().min(0, 'Must be at least 0').default(0),
    updateParallelism: z.coerce.number().int().min(0, 'Must be at least 0').default(1),
    updateDelay: z.string().default('0s'),
    updateFailureAction: z.enum(['pause', 'continue', 'rollback']).default('pause'),
    updateOrder: z.enum(['stop-first', 'start-first']).default('stop-first'),
});

export const removeServicesSchema = z.object({
    serviceIds: z.array(z.string()),
});

export const updateServiceImageSchema = z.object({
    image: z.string().min(1, 'Image is required'),
    forceUpdate: z.boolean().default(false),
});
