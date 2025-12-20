import { z } from 'zod';

export const dockerConnectionTypeSchema = z.enum(['UNIX_SOCKET', 'TCP', 'TCP_TLS']);

export const environmentSchema = z.object({
    id: z.cuid().optional(),
    name: z.string().min(1, 'Name is required'),
    connectionType: dockerConnectionTypeSchema,
    socketPath: z.string().optional(),
    host: z.string().optional(),
    port: z.number().int().min(1).max(65535).optional(),
    tlsCert: z.string().optional(),
    tlsKey: z.string().optional(),
    tlsCa: z.string().optional(),
    description: z.string().optional(),
});

export const environmentIdSchema = z.object({
    environmentId: z.cuid(),
});

export type EnvironmentSchemaType = z.infer<typeof environmentSchema>;
export type EnvironmentIdType = z.infer<typeof environmentIdSchema>;
