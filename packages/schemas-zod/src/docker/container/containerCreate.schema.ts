import { z } from 'zod';

const portMappingSchema = (t: any) =>
    z.object({
        hostPort: z.coerce
            .number()
            .min(1, t('portRange'))
            .max(65535, t('portRange')),
        containerPort: z.coerce
            .number()
            .min(1, t('portRange'))
            .max(65535, t('portRange')),
        protocol: z.enum(['tcp', 'udp', 'sctp']).default('tcp'),
    });

const envVarSchema = (t: any) =>
    z.object({
        key: z.string().min(1, t('fieldRequired', { field: t('fieldNames.key') })),
        value: z.string().min(1, t('fieldRequired', { field: t('fieldNames.value') })),
    });

const labelsSchema = (t: any) =>
    z.object({
        key: z.string().min(1, t('fieldRequired', { field: t('fieldNames.key') })),
        value: z.string().min(1, t('fieldRequired', { field: t('fieldNames.value') })),
    });

const volumeMountSchema = (t: any) =>
    z.object({
        hostPath: z.string().min(1, t('fieldRequired', { field: t('fieldNames.hostPath') })),
        containerPath: z.string().min(1, t('fieldRequired', { field: t('fieldNames.containerPath') })),
        readOnly: z.boolean().default(false),
    });

const networkSchema = (t: any) =>
    z.object({
        name: z.string().min(1, t('fieldRequired', { field: t('fieldNames.network') })),
    });

export const containerCreateFormSchema = (t: any) =>
    z.object({
        name: z.string().optional(),
        image: z.string().min(1, t('fieldRequired', { field: t('fieldNames.image') })),
        restart: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).default('unless-stopped'),
        networks: z.array(networkSchema(t)).default([]),
        hostname: z.string().optional(),
        autoRemove: z.boolean().default(false),
        privileged: z.boolean().default(false),
        ports: z.array(portMappingSchema(t)).default([]),
        envVars: z.array(envVarSchema(t)).default([]),
        volumes: z.array(volumeMountSchema(t)).default([]),
        labels: z.array(labelsSchema(t)).default([]),
    });

export type ContainerCreateForm = z.infer<ReturnType<typeof containerCreateFormSchema>>;
