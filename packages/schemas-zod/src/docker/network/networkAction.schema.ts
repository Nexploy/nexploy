import { z } from 'zod';

const networkOptionSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
});

const networkLabelSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
});

const ipamConfigItemSchema = z.object({
    subnet: z.string().min(1, 'Subnet is required'),
    ipRange: z.string().min(1, 'IP Range is required'),
    gateway: z.string().min(1, 'Gateway is required'),
});

const IPAMSchema = z
    .object({
        driver: z.string().optional(),
        config: z.array(ipamConfigItemSchema).default([]),
    })
    .optional();

export const networkCreateSchema = z.object({
    name: z.string().min(1, 'Network name is required.').max(255, 'Network name is too long.'),
    checkDuplicate: z.boolean().optional(),
    driver: z.string().default('bridge'),
    scope: z.string().default('local'),
    enableIPv4: z.boolean().optional(),
    enableIPv6: z.boolean().optional(),
    ipam: IPAMSchema,
    internal: z.boolean().default(false).optional(),
    attachable: z.boolean().default(false).optional(),
    ingress: z.boolean().optional(),
    configOnly: z.boolean().optional(),
    configFrom: z.object({
        network: z.string().optional(),
    }),
    options: z.array(networkOptionSchema).default([]),
    labels: z.array(networkLabelSchema).default([]),
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
