import { z } from 'zod';

export const createLogSchema = z.object({
    logs: z.array(
        z.object({
            createdAt: z.date(),
            level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']),
            step: z.string(),
            message: z.string(),
        }),
    ),
    buildId: z.cuid(),
});
