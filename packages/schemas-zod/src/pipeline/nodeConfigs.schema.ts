import { z } from 'zod';

export const cloneRepositoryConfigSchema = z.object({
    branch: z.string(),
    commitHash: z.string().optional(),
});

export const buildDockerImageConfigSchema = z.object({
    dockerfilePath: z.string().min(1, 'Dockerfile path is required').default('Dockerfile'),
    buildArgs: z.record(z.string(), z.string()).default({}),
});

export const validateDockerfileConfigSchema = z.object({
    dockerfilePath: z.string().min(1, 'Dockerfile path is required').default('Dockerfile'),
});

export const composeFileConfigSchema = z.object({
    composeFileName: z
        .string()
        .min(1, 'Compose file name is required')
        .default('docker-compose.yml'),
    composeFilePath: z.string().optional(),
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
});

export const varEntrySchema = z.object({
    id: z.string(),
    key: z.string().min(1, 'Key is required'),
    value: z.string(),
});

export const setEnvVarsConfigSchema = z.object({
    vars: z.array(varEntrySchema).default([]),
});

export const pushToRegistryConfigSchema = z.object({
    tag: z.string().optional(),
});

export const cleanWorkdirConfigSchema = z.object({});

export const saveVersionConfigSchema = z.object({});

export const setEnvironmentConfigSchema = z.object({
    environmentId: z.string().min(1, 'Environment is required'),
});

export const sendNotificationConfigSchema = z.object({
    webhookUrl: z
        .string()
        .refine(
            (v) => v === '' || z.string().url().safeParse(v).success,
            'Webhook URL must be a valid URL',
        )
        .default(''),
    triggerOn: z.array(z.enum(['success', 'failure', 'always'])).default(['always']),
    message: z.string().optional(),
});

export type PushToRegistryConfig = z.infer<typeof pushToRegistryConfigSchema>;
export type CleanWorkdirConfig = z.infer<typeof cleanWorkdirConfigSchema>;
export type VarEntry = z.infer<typeof varEntrySchema>;
export type SetEnvVarsConfig = z.infer<typeof setEnvVarsConfigSchema>;
export type CloneRepositoryConfig = z.infer<typeof cloneRepositoryConfigSchema>;
export type BuildDockerImageConfig = z.infer<typeof buildDockerImageConfigSchema>;
export type ValidateDockerfileConfig = z.infer<typeof validateDockerfileConfigSchema>;
export type ComposeFileConfig = z.infer<typeof composeFileConfigSchema>;
export type DeployContainerConfig = z.infer<typeof deployContainerConfigSchema>;
export type WriteEnvFileConfig = z.infer<typeof writeEnvFileConfigSchema>;
export type SaveVersionConfig = z.infer<typeof saveVersionConfigSchema>;
export type SendNotificationConfig = z.infer<typeof sendNotificationConfigSchema>;
export type SetEnvironmentConfig = z.infer<typeof setEnvironmentConfigSchema>;
