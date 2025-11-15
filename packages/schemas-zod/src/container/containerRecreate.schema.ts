import { z } from 'zod';

const portMappingSchema = z.object({
    typeAction: z.enum(['add', 'delete', 'edit']),
    privatePort: z.number().optional(),
    currentPrivatePort: z.number().optional(),
    publicPort: z.number().optional(),
    currentPublicPort: z.number().optional(),
    type: z.enum(['tcp', 'udp', 'sctp']).optional(),
    currentType: z.enum(['tcp', 'udp', 'sctp']).optional(),
});

export type PortForm = z.infer<typeof portMappingSchema>;

const envVarMappingSchema = z.object({
    typeAction: z.enum(['add', 'delete', 'edit']),
    key: z.string().optional(),
    value: z.string().optional(),
    currentKey: z.string().optional(),
    currentValue: z.string().optional(),
});

export type EnvVarForm = z.infer<typeof envVarMappingSchema>;

const volumeMappingSchema = z.object({
    typeAction: z.enum(['add', 'delete', 'edit']),
    hostPath: z.string().optional(),
    currentHostPath: z.string().optional(),
    containerPath: z.string().optional(),
    currentContainerPath: z.string().optional(),
    readOnly: z.boolean().optional(),
    currentReadOnly: z.boolean().optional(),
});

export type VolumeForm = z.infer<typeof volumeMappingSchema>;

const networkMappingSchema = z.object({
    typeAction: z.enum(['add', 'delete', 'edit']),
    name: z.string().optional(),
    currentName: z.string().optional(),
});

export type NetworkForm = z.infer<typeof networkMappingSchema>;

export const ContainerRecreateFormSchema = z.object({
    containerId: z.string(),
    ports: z.array(portMappingSchema).default([]),
    envVars: z.array(envVarMappingSchema).default([]),
    volumes: z.array(volumeMappingSchema).default([]),
    networks: z.array(networkMappingSchema).default([]),
});

export type ContainerRecreateForm = z.infer<typeof ContainerRecreateFormSchema>;
