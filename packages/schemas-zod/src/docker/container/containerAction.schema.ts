import { z } from 'zod';

export const containerActionsSchema = z.object({
    containerId: z.string(),
});

export const containerIdParamSchema = z.object({
    id: z.string().min(1),
});

export const containerNameParamSchema = z.object({
    name: z.string().min(1),
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

export const containerExecBodySchema = z.object({
    command: z.string().min(1),
    workdir: z.string().optional(),
});
