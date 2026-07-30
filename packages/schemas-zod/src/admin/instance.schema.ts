import { z } from 'zod';

export const instanceDomainSchema = z
    .object({
        domain: z.string().min(1, 'A domain or IP address is required'),
        useTls: z.boolean(),
        acmeEmail: z.string().email().optional(),
    })
    .refine((data) => !data.useTls || !!data.acmeEmail, {
        message: "An email is required to enable HTTPS via Let's Encrypt",
        path: ['acmeEmail'],
    });

export type InstanceDomainInput = z.infer<typeof instanceDomainSchema>;

export const upgradeSchema = z.object({
    version: z.string().regex(/^[\w.\-]+$/, 'Invalid version format'),
});

export type UpgradeInput = z.infer<typeof upgradeSchema>;
