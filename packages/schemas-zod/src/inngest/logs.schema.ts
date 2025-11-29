import { z } from 'zod';

export const postCreateLogs = z.object({
    logs: z.array(
        z.object({
            createdAt: z.date(),
            level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']),
            step: z.string(),
            message: z.string(),
        }),
    ),
    deploymentId: z.cuid(),
});
