import { z } from 'zod';
import { paginationQuerySchema } from '../table/pagination.schema';

export const activityQuerySchema = paginationQuerySchema.extend({
    name: z.string().trim().min(1).optional(),
    resource: z.string().trim().min(1).optional(),
    status: z.enum(['SUCCESS', 'FAILURE', 'DENIED']).optional(),
    source: z.enum(['SERVER_ACTION', 'API_ROUTE']).optional(),
    actorId: z.string().trim().min(1).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
});

export type ActivityQueryInput = z.infer<typeof activityQuerySchema>;

export const activityRetentionSchema = z.object({
    retentionDays: z.number().int().min(0).max(3650),
});

export type ActivityRetentionInput = z.infer<typeof activityRetentionSchema>;

export const purgeActivityLogsSchema = z.object({});

export type PurgeActivityLogsInput = z.infer<typeof purgeActivityLogsSchema>;
