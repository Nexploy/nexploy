import { z } from 'zod';

export const containerActionsSchema = z.object({
    containerIds: z.array(z.string().min(1)).min(1),
});

export const containerRemoveSchema = z.object({
    containerIds: z.array(z.string().min(1)).min(1),
    removeVolumes: z.boolean().optional().default(false),
    force: z.boolean().optional().default(false),
});

export const containerPruneSchema = z.object({
    olderThan: z.string().optional(),
    filter: z.string().optional(),
});

export const containerIdOrNameParamSchema = z.object({
    idOrName: z.string().min(1),
});

export const containerLogsQuerySchema = z.object({
    tail: z.string().optional(),
    since: z.string().optional(),
});

export const containerRunEphemeralSchema = z.object({
    image: z.string().min(1),
    command: z.string().min(1),
    workdir: z.string().optional(),
    mountPath: z.string().optional(),
    networkMode: z.string().optional(),
});

export const containerRenameSchema = z.object({
    containerId: z.string().min(1),
    name: z
        .string()
        .min(1)
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, {
            message: 'Name must start with a letter or digit and contain only letters, digits, _, . or -',
        }),
});

export const containerRenameBodySchema = z.object({
    containerId: z.string().min(1),
    name: z.string().min(1),
});

export const containerRestartPolicySchema = z
    .object({
        containerId: z.string().min(1),
        policy: z.enum(['no', 'always', 'on-failure', 'unless-stopped']),
        maximumRetryCount: z.number().int().min(0).max(100).default(0),
    })
    .refine((value) => value.policy === 'on-failure' || value.maximumRetryCount === 0, {
        message: 'Maximum retry count is only allowed with the on-failure policy',
        path: ['maximumRetryCount'],
    });

export const containerExecBodySchema = z.object({
    command: z.string().min(1),
    workdir: z
        .string()
        .refine((v) => v.startsWith('/'), {
            message: 'Container working directory must be an absolute path',
        })
        .optional(),
    user: z.string().optional(),
});

export const mcpListContainersSchema = z.object({
    filter: z.enum(['all', 'running', 'stopped']).optional(),
});

export const mcpContainerActionSchema = z.object({
    idOrName: z.string().describe('Container name or ID (partial OK)'),
    action: z.enum(['start', 'stop', 'restart', 'remove']),
});

export const mcpGetContainerLogsSchema = z.object({
    idOrName: z.string().describe('Container name or ID'),
    tail: z.number().optional().default(50).describe('Number of lines (default 50)'),
});

export const mcpExecInContainerSchema = z.object({
    idOrName: z.string().describe('Container name or ID'),
    command: z.string().describe('Shell command to run (e.g. "ls /app")'),
});
