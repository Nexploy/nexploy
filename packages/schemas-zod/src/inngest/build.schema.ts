import { z } from 'zod';

export const startBuildSchema = z.object({
    repositoryId: z.cuid(),
    branch: z.string().optional(),
});

export type StartBuildSchemaType = z.infer<typeof startBuildSchema>;

export const removeBuildSchema = z.object({
    buildId: z.cuid(),
});

export const cancelBuildSchema = z.object({
    buildId: z.cuid(),
});

export const deployVersionSchema = z.object({
    imageTag: z.string(),
    repositoryId: z.cuid(),
    environmentId: z.string().optional(),
});

export const deleteVersionSchema = z.object({
    imageTag: z.string(),
    repositoryId: z.cuid(),
});

export const mcpTriggerBuildSchema = z.object({
    repositoryId: z.string().describe('Repository ID (use listRepositories to find it)'),
    branch: z.string().optional().describe('Branch to build (uses default if omitted)'),
});

export const listBuildsSchema = z.object({
    repositoryId: z.cuid().describe('Repository ID'),
});

export const getBuildLogsSchema = z.object({
    repositoryId: z.cuid().describe('Repository ID'),
    buildId: z.cuid().describe('Build ID'),
    nodeId: z.string().describe('Pipeline node ID (e.g. clone-repository, build-docker-image)'),
});

export const setMcpEnvVariablesSchema = z.object({
    repositoryId: z.cuid().describe('Repository ID'),
    vars: z
        .array(
            z.object({
                key: z.string().min(1).describe('Variable name'),
                value: z.string().describe('Variable value'),
            }),
        )
        .describe('Environment variables to set or update'),
});
