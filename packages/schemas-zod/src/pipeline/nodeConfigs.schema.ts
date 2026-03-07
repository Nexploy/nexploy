import { z } from 'zod';

export const cloneRepositoryConfigSchema = z.object({});

export const buildDockerImageConfigSchema = z.object({
    dockerfilePath: z.string().default('Dockerfile'),
    buildArgs: z.record(z.string(), z.string()).default({}),
});

export const deployContainerConfigSchema = z.object({
    environmentId: z.string().optional(),
    ports: z
        .array(
            z.object({
                containerPort: z.number(),
                hostPort: z.number().optional(),
                protocol: z.enum(['tcp', 'udp']).default('tcp'),
            }),
        )
        .default([]),
});

export const writeEnvFileConfigSchema = z.object({
    useRepositoryEnvVars: z.boolean().default(true),
    additionalVars: z.record(z.string(), z.string()).default({}),
});

export const varEntrySchema = z.object({
    id: z.string(),
    key: z.string().min(1, 'Key is required'),
    value: z.string(),
});

export const setEnvVarsConfigSchema = z.object({
    vars: z.array(varEntrySchema).default([]),
});

export const sendNotificationConfigSchema = z.object({
    webhookUrl: z.url().or(z.string().default('')),
    triggerOn: z.array(z.enum(['success', 'failure', 'always'])).default(['always']),
    message: z.string().optional(),
});

export type VarEntry = z.infer<typeof varEntrySchema>;
export type SetEnvVarsConfig = z.infer<typeof setEnvVarsConfigSchema>;
export type CloneRepositoryConfig = z.infer<typeof cloneRepositoryConfigSchema>;
export type BuildDockerImageConfig = z.infer<typeof buildDockerImageConfigSchema>;
export type DeployContainerConfig = z.infer<typeof deployContainerConfigSchema>;
export type WriteEnvFileConfig = z.infer<typeof writeEnvFileConfigSchema>;
export type SendNotificationConfig = z.infer<typeof sendNotificationConfigSchema>;
