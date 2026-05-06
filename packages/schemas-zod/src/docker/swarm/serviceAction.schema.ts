import { z } from 'zod';

export const serviceIdParamSchema = z.object({
    id: z.string().min(1),
});

export const scaleServiceSchema = z.object({
    replicas: z.number().int().min(0),
});

// API schema used by docker-api route handler
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
                publishMode: z.enum(['ingress', 'host']).optional().default('ingress'),
            }),
        )
        .optional(),
    env: z.array(z.string()).optional(),
    networks: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
    labels: z.record(z.string(), z.string()).optional(),
    command: z.array(z.string()).optional(),
    workDir: z.string().optional(),
    user: z.string().optional(),
    mounts: z
        .array(
            z.object({
                source: z.string().optional(),
                target: z.string(),
                type: z.enum(['bind', 'volume', 'tmpfs']).optional().default('bind'),
                readOnly: z.boolean().optional().default(false),
            }),
        )
        .optional(),
    resourceLimits: z
        .object({
            nanoCPUs: z.number().optional(),
            memoryBytes: z.number().optional(),
        })
        .optional(),
    resourceReservations: z
        .object({
            nanoCPUs: z.number().optional(),
            memoryBytes: z.number().optional(),
        })
        .optional(),
    restartPolicy: z
        .object({
            condition: z.enum(['none', 'on-failure', 'any']).optional(),
            maxAttempts: z.number().int().min(0).optional(),
        })
        .optional(),
    updateConfig: z
        .object({
            parallelism: z.number().int().min(0).optional(),
            delay: z.number().optional(),
            failureAction: z.enum(['pause', 'continue', 'rollback']).optional(),
            order: z.enum(['stop-first', 'start-first']).optional(),
        })
        .optional(),
});

// Form schema used by the create service page
export const createServiceFormSchema = z.object({
    name: z.string().min(1),
    image: z.string().min(1),
    mode: z.enum(['replicated', 'global']).default('replicated'),
    replicas: z.coerce.number().int().min(1).default(1),
    ports: z
        .array(
            z.object({
                published: z.coerce.number().int().min(1).max(65535),
                target: z.coerce.number().int().min(1).max(65535),
                protocol: z.enum(['tcp', 'udp']).default('tcp'),
                publishMode: z.enum(['ingress', 'host']).default('ingress'),
            }),
        )
        .default([]),
    envVars: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
    networks: z.array(z.string()).default([]),
    labelsList: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
    constraints: z.array(z.string()).default([]),
    command: z.string().optional(),
    workDir: z.string().optional(),
    user: z.string().optional(),
    mounts: z
        .array(
            z.object({
                source: z.string().optional(),
                target: z.string(),
                type: z.enum(['bind', 'volume', 'tmpfs']).default('bind'),
                readOnly: z.boolean().default(false),
            }),
        )
        .default([]),
    cpuLimit: z.string().optional(),
    memoryLimit: z.string().optional(),
    cpuReservation: z.string().optional(),
    memoryReservation: z.string().optional(),
    restartCondition: z.enum(['none', 'on-failure', 'any']).optional(),
    restartMaxAttempts: z.coerce.number().int().min(0).optional(),
    updateParallelism: z.coerce.number().int().min(0).optional(),
    updateDelay: z.string().optional(),
    updateFailureAction: z.enum(['pause', 'continue', 'rollback']).optional(),
    updateOrder: z.enum(['stop-first', 'start-first']).optional(),
});

export type CreateServiceForm = z.infer<typeof createServiceFormSchema>;

export const removeServiceSchema = z.object({
    force: z.boolean().optional().default(false),
});
