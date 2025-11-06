import { z } from 'zod';

const portMappingSchema = z.object({
    hostPort: z.string(),
    containerPort: z.string(),
    protocol: z.enum(['tcp', 'udp']).default('tcp'),
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

export const ContainerCreateFormSchema = z
    .object({
        name: z.string().optional(),
        image: z.string().min(1, "L'image est requise"),
        restart: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).default('unless-stopped'),
        network: z.string().optional(),
        hostname: z.string().optional(),
        autoRemove: z.boolean().default(false),
        privileged: z.boolean().default(false),
        ports: z.array(portMappingSchema).default([]),
        envVars: z.array(envVarSchema).default([]),
        volumes: z.array(volumeMountSchema).default([]),
    })
    .transform((data) => ({
        ...data,
        name: data.name?.trim() || undefined,
        network: data.network?.trim() || undefined,
        hostname: data.hostname?.trim() || undefined,
        ports: data.ports.filter((p) => p.hostPort && p.containerPort),
        envVars: data.envVars.filter((e) => e.key && e.value),
        volumes: data.volumes.filter((v) => v.hostPath && v.containerPath),
    }));

export type ContainerCreateForm = z.infer<typeof ContainerCreateFormSchema>;
