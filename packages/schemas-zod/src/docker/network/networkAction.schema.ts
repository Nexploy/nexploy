import { z } from 'zod';

const IPAMSchema = z
    .object({
        driver: z.string().optional(),
        config: z
            .array(
                z.object({
                    subnet: z.string().optional(),
                    ipRange: z.string().optional(),
                    gateway: z.string().optional(),
                    auxAddress: z.record(z.string(), z.string()).optional(),
                }),
            )
            .optional(),
        options: z.record(z.string(), z.string()).optional(),
    })
    .optional();

export const networkCreateSchema = z.object({
    name: z
        .string()
        .min(1, 'Le nom du réseau est requis.')
        .max(255, 'Le nom du réseau est trop long.'),
    checkDuplicate: z.boolean().optional(),
    driver: z.string().optional(),
    scope: z.string().optional(),
    enableIPv4: z.boolean().optional(),
    enableIPv6: z.boolean().optional(),
    ipam: IPAMSchema,
    internal: z.boolean().default(false).optional(),
    attachable: z.boolean().default(false).optional(),
    ingress: z.boolean().optional(),
    configOnly: z.boolean().optional(),
    configFrom: z
        .object({
            network: z.string().optional(),
        })
        .optional(),
    options: z.record(z.string(), z.string()).default({}).optional(),
    labels: z.record(z.string(), z.string()).default({}).optional(),
});

export type NetworkCreateForm = z.infer<typeof networkCreateSchema>;

export const networkActionsSchema = z.object({
    networkIds: z.array(z.string()),
    action: z.enum(['delete', 'prune']),
    force: z.boolean().optional(),
});
