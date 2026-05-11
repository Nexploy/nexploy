import { z } from 'zod';

const portMappingSchema = z.object({
    hostPort: z
        .number({
            error: 'Host port is required',
        })
        .min(1)
        .max(65535),
    containerPort: z
        .number({
            error: 'Container port is required',
        })
        .min(1)
        .max(65535),
    protocol: z.enum(['tcp', 'udp', 'sctp']).default('tcp'),
});

const envVarSchema = z.object({
    key: z.string().min(1, {
        error: 'Environment variable key is required',
    }),
    value: z.string().min(1, {
        error: 'Environment variable value is required',
    }),
});

const labelsSchema = z.object({
    key: z.string().min(1, {
        error: 'Label key is required',
    }),
    value: z.string().min(1, {
        error: 'Label value is required',
    }),
});

const volumeMountSchema = z.object({
    hostPath: z.string().min(1, {
        error: 'Host path is required',
    }),
    containerPath: z.string().min(1, {
        error: 'Container path is required',
    }),
    readOnly: z.boolean().default(false),
});

const networkSchema = z.object({
    name: z.string().min(1, {
        error: 'Network name is required',
    }),
});

export const containerCreateFormSchema = z.object({
    name: z.string().optional(),
    image: z.string().min(1, 'Image is required'),
    restart: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).default('unless-stopped'),
    networks: z.array(networkSchema).default([]),
    hostname: z.string().optional(),
    autoRemove: z.boolean().default(false),
    privileged: z.boolean().default(false),
    ports: z.array(portMappingSchema).default([]),
    envVars: z.array(envVarSchema).default([]),
    volumes: z.array(volumeMountSchema).default([]),
    labels: z.array(labelsSchema).default([]),
});

export type ContainerCreateForm = z.infer<typeof containerCreateFormSchema>;
