import { z } from 'zod';

export const instanceTlsModes = ['ip', 'letsencrypt', 'custom'] as const;

export type InstanceTlsMode = (typeof instanceTlsModes)[number];

const HOSTNAME_REGEX = /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))+$/;

export const instanceDomainSchema = z
    .object({
        domain: z.string().min(1, 'A domain or IP address is required'),
        mode: z.enum(instanceTlsModes),
        acmeEmail: z.string().email().optional(),
        certificateId: z.string().optional(),
    })
    .refine((data) => data.mode !== 'letsencrypt' || !!data.acmeEmail, {
        message: "An email is required to enable HTTPS via Let's Encrypt",
        path: ['acmeEmail'],
    })
    .refine((data) => data.mode !== 'letsencrypt' || HOSTNAME_REGEX.test(data.domain), {
        message: "Let's Encrypt requires a public domain name, not an IP address",
        path: ['domain'],
    })
    .refine((data) => data.mode !== 'custom' || !!data.certificateId, {
        message: 'Select a custom certificate to serve HTTPS with',
        path: ['certificateId'],
    });

export type InstanceDomainInput = z.infer<typeof instanceDomainSchema>;

export const upgradeSchema = z.object({
    version: z.string().regex(/^[\w.\-]+$/, 'Invalid version format'),
});

export type UpgradeInput = z.infer<typeof upgradeSchema>;
