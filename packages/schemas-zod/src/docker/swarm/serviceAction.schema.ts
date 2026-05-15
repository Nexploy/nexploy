import { z } from 'zod';

export const serviceIdParamSchema = z.object({
    id: z.string().min(1),
});

export const scaleServiceSchema = z.object({
    replicas: z.coerce.number().min(0, 'Replicas must be at least 0'),
});

export const scaleServiceFormSchema = (t: any) =>
    z.object({
        id: z.string().min(1),
        replicas: z.coerce.number().min(0, t('minValue', { min: 0 })),
    });

const servicePortSchema = (t: any) =>
    z.object({
        published: z.coerce
            .number()
            .int()
            .min(1, t('portRange'))
            .max(65535, t('portRange')),
        target: z.coerce
            .number()
            .int()
            .min(1, t('portRange'))
            .max(65535, t('portRange')),
        protocol: z.enum(['tcp', 'udp']).default('tcp'),
        publishMode: z.enum(['ingress', 'host']).default('ingress'),
    });

const serviceEnvVarSchema = (t: any) =>
    z.object({
        key: z.string().min(1, t('fieldRequired', { field: t('fieldNames.key') })),
        value: z.string(),
    });

const serviceLabelSchema = (t: any) =>
    z.object({
        key: z.string().min(1, t('fieldRequired', { field: t('fieldNames.key') })),
        value: z.string(),
    });

const serviceMountSchema = (t: any) =>
    z.object({
        source: z.string().optional(),
        target: z.string().min(1, t('fieldRequired', { field: t('fieldNames.target') })),
        type: z.enum(['bind', 'volume', 'tmpfs']).default('bind'),
        readOnly: z.boolean().default(false),
    });

export const createServiceFormSchema = (t: any) =>
    z.object({
        name: z.string().min(1, t('fieldRequired', { field: t('fieldNames.name') })),
        image: z.string().min(1, t('fieldRequired', { field: t('fieldNames.image') })),
        mode: z.enum(['replicated', 'global']).default('replicated'),
        replicas: z.coerce.number().min(1, t('minValue', { min: 1 })).default(1),
        ports: z.array(servicePortSchema(t)).default([]),
        envVars: z.array(serviceEnvVarSchema(t)).default([]),
        networks: z.array(z.string()).default([]),
        labels: z.array(serviceLabelSchema(t)).default([]),
        constraints: z.array(z.string()).default([]),
        command: z.string().optional(),
        workDir: z.string().optional(),
        user: z.string().optional(),
        mounts: z.array(serviceMountSchema(t)).default([]),
        cpuLimit: z.string().optional(),
        memoryLimit: z.string().optional(),
        cpuReservation: z.string().optional(),
        memoryReservation: z.string().optional(),
        restartCondition: z.enum(['none', 'on-failure', 'any']).optional(),
        restartMaxAttempts: z.coerce.number().int().min(0, t('minValue', { min: 0 })).optional(),
        updateParallelism: z.coerce.number().int().min(0, t('minValue', { min: 0 })).optional(),
        updateDelay: z.string().optional(),
        updateFailureAction: z.enum(['pause', 'continue', 'rollback']).optional(),
        updateOrder: z.enum(['stop-first', 'start-first']).optional(),
    });

export const removeServicesSchema = z.object({
    serviceIds: z.array(z.string()),
});
