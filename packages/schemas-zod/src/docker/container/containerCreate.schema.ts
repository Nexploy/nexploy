import { z } from 'zod';

const portMappingSchema = z.object({
    hostPort: z.coerce.number().min(1).max(65535),
    containerPort: z.coerce.number().min(1).max(65535),
    protocol: z.enum(['tcp', 'udp', 'sctp']).default('tcp'),
});

const envVarSchema = z.object({
    key: z.string(),
    value: z.string(),
});

const volumeMountSchema = z.object({
    hostPath: z.string(),
    containerPath: z.string(),
    readOnly: z.boolean().default(false),
});

export const containerCreateFormSchema = z.object({
    name: z.string().optional(),
    image: z.string().min(1, 'Image is required'),
    restart: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).default('unless-stopped'),
    networks: z.array(z.string()).default([]),
    hostname: z.string().optional(),
    autoRemove: z.boolean().default(false),
    privileged: z.boolean().default(false),
    ports: z.array(portMappingSchema).default([]),
    envVars: z.array(envVarSchema).default([]),
    volumes: z.array(volumeMountSchema).default([]),
});

export type ContainerCreateForm = z.infer<typeof containerCreateFormSchema>;
