import { z } from 'zod';

export const dockerConnectionTypeSchema = z.enum(['UNIX_SOCKET', 'TCP', 'TCP_TLS']);

export const environmentSchema = (t: any) =>
    z
        .object({
            id: z.cuid().optional(),
            name: z.string().min(1, t('fieldRequired', { field: t('fieldNames.name') })),
            connectionType: dockerConnectionTypeSchema,
            socketPath: z.string().optional(),
            host: z.string().optional(),
            port: z.number().int().min(1).max(65535).optional(),
            tlsCert: z.string().optional(),
            tlsKey: z.string().optional(),
            tlsCa: z.string().optional(),
            description: z.string().optional(),
            isDefault: z.boolean().optional(),
        })
        .refine(
            (data) => {
                if (data.connectionType === 'UNIX_SOCKET') {
                    return !!data.socketPath;
                }
                if (data.connectionType === 'TCP' || data.connectionType === 'TCP_TLS') {
                    return !!data.host && !!data.port;
                }
                return true;
            },
            {
                message: t('connectionTypeRequired'),
            },
        );

export const environmentIdSchema = z.object({
    environmentId: z.cuid(),
});

export type EnvironmentSchemaType = z.infer<ReturnType<typeof environmentSchema>>;
export type EnvironmentIdType = z.infer<typeof environmentIdSchema>;
