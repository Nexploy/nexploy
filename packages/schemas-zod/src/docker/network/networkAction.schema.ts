import { z } from 'zod';

const networkOptionSchema = (t: any) =>
    z.object({
        key: z.string().min(1, t('fieldRequired', { field: t('fieldNames.key') })),
        value: z.string().min(1, t('fieldRequired', { field: t('fieldNames.value') })),
    });

const networkLabelSchema = (t: any) =>
    z.object({
        key: z.string().min(1, t('fieldRequired', { field: t('fieldNames.key') })),
        value: z.string().min(1, t('fieldRequired', { field: t('fieldNames.value') })),
    });

const ipamConfigItemSchema = (t: any) =>
    z.object({
        subnet: z.string().min(1, t('fieldRequired', { field: t('fieldNames.subnet') })),
        ipRange: z.string().min(1, t('fieldRequired', { field: t('fieldNames.ipRange') })),
        gateway: z.string().min(1, t('fieldRequired', { field: t('fieldNames.gateway') })),
    });

const IPAMSchema = (t: any) =>
    z
        .object({
            driver: z.string().optional(),
            config: z.array(ipamConfigItemSchema(t)).default([]),
        })
        .optional();

export const networkCreateSchema = (t: any) =>
    z.object({
        name: z.string().min(1, t('fieldRequired', { field: t('fieldNames.name') })).max(255, t('tooLong')),
        checkDuplicate: z.boolean().optional(),
        driver: z.string().default('bridge'),
        scope: z.string().default('local'),
        enableIPv4: z.boolean().optional(),
        enableIPv6: z.boolean().optional(),
        ipam: IPAMSchema(t),
        internal: z.boolean().default(false).optional(),
        attachable: z.boolean().default(false).optional(),
        ingress: z.boolean().default(false).optional(),
        configOnly: z.boolean().optional(),
        configFrom: z.object({
            network: z.string().optional(),
        }),
        options: z.array(networkOptionSchema(t)).default([]),
        labels: z.array(networkLabelSchema(t)).default([]),
    });

export const networkActionsSchema = z.object({
    networkIds: z.array(z.string()),
    action: z.enum(['delete', 'prune']),
    force: z.boolean().optional(),
});

export const networkDeleteSchema = z.object({
    networkIds: z.array(z.string()).min(1),
    force: z.boolean().optional().default(false),
});

export const networkIdParamSchema = z.object({
    id: z.string().min(1),
});
