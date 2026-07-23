import { z } from 'zod';

const portMappingSchema = z.object({
    hostPort: z.coerce
        .number()
        .min(1, 'Port must be between 1 and 65535')
        .max(65535, 'Port must be between 1 and 65535'),
    containerPort: z.coerce
        .number()
        .min(1, 'Port must be between 1 and 65535')
        .max(65535, 'Port must be between 1 and 65535'),
    protocol: z.enum(['tcp', 'udp', 'sctp']).default('tcp'),
});

const envVarSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
});

const labelsSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
});

const volumeMountSchema = z.object({
    hostPath: z.string().min(1, 'Host path is required'),
    containerPath: z.string().min(1, 'Container path is required'),
    readOnly: z.boolean().default(false),
});

const networkSchema = z.object({
    name: z.string().min(1, 'Network is required'),
});

const createAuthSchema = z.object({
    username: z.string(),
    password: z.string(),
    serveraddress: z.string().optional(),
});

export const containerCreateFormSchema = z.object({
    name: z.string().optional(),
    image: z.string().min(1, 'Image is required'),
    restart: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).default('unless-stopped'),
    networks: z.array(networkSchema).default([]),
    hostname: z.string().optional(),
    autoRemove: z.boolean().default(false),
    ports: z.array(portMappingSchema).default([]),
    envVars: z.array(envVarSchema).default([]),
    volumes: z.array(volumeMountSchema).default([]),
    labels: z.array(labelsSchema).default([]),
    registryId: z.string().optional(),
    auth: createAuthSchema.optional(),
});

export type ContainerCreateForm = z.infer<typeof containerCreateFormSchema>;
