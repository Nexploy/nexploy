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

export const ACTIVITY_EXPORT_MAX_ROWS = 100_000;

export const activityExportFormatSchema = z.enum(['csv', 'json', 'ndjson']);

export const activityExportQuerySchema = z.object({
    format: activityExportFormatSchema.default('csv'),
    search: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    resource: z.string().trim().min(1).optional(),
    status: z.enum(['SUCCESS', 'FAILURE', 'DENIED']).optional(),
    source: z.enum(['SERVER_ACTION', 'API_ROUTE']).optional(),
    actorId: z.string().trim().min(1).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(ACTIVITY_EXPORT_MAX_ROWS).default(ACTIVITY_EXPORT_MAX_ROWS),
});

export type ActivityExportQueryInput = z.infer<typeof activityExportQuerySchema>;

export const ACTIVITY_EXPORT_ALL_VALUE = 'all';

export const activityExportPeriodSchema = z.enum(['24h', '7d', '30d', '90d', 'all', 'custom']);

export type ActivityExportPeriod = z.infer<typeof activityExportPeriodSchema>;

export const activityExportFormSchema = z
    .object({
        format: activityExportFormatSchema,
        period: activityExportPeriodSchema,
        customFrom: z.string(),
        customTo: z.string(),
        status: z.enum([ACTIVITY_EXPORT_ALL_VALUE, 'SUCCESS', 'FAILURE', 'DENIED']),
        source: z.enum([ACTIVITY_EXPORT_ALL_VALUE, 'SERVER_ACTION', 'API_ROUTE']),
        applySearch: z.boolean(),
    })
    .superRefine((values, ctx) => {
        if (values.period !== 'custom') return;

        if (!values.customFrom) {
            ctx.addIssue({ code: 'custom', path: ['customFrom'], message: 'rangeRequired' });
        }

        if (!values.customTo) {
            ctx.addIssue({ code: 'custom', path: ['customTo'], message: 'rangeRequired' });
        }

        if (values.customFrom && values.customTo && values.customFrom > values.customTo) {
            ctx.addIssue({ code: 'custom', path: ['customTo'], message: 'rangeInvalid' });
        }
    });

export type ActivityExportFormValues = z.infer<typeof activityExportFormSchema>;

export const activityRetentionSchema = z.object({
    retentionDays: z.number().int().min(0).max(3650),
});

export type ActivityRetentionInput = z.infer<typeof activityRetentionSchema>;

export const purgeActivityLogsSchema = z.object({});

export type PurgeActivityLogsInput = z.infer<typeof purgeActivityLogsSchema>;
