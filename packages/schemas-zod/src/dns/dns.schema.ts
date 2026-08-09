import { z } from 'zod';
import type { DnsProviderCapabilities, DnsProviderId } from '@workspace/typescript-interface/dns/dns';

export const dnsProviderIds = [
    'CLOUDFLARE',
    'HETZNER',
    'DIGITALOCEAN',
    'VULTR',
    'LINODE',
    'PORKBUN',
    'POWERDNS',
    'OVH',
] as const;

export const dnsProviderIdSchema = z.enum(dnsProviderIds);

export interface DnsCredentialField {
    name: string;
    secret: boolean;
    optional?: boolean;
}

export interface DnsProviderDescriptor {
    id: DnsProviderId;
    capabilities: DnsProviderCapabilities;
    credentialFields: DnsCredentialField[];
    experimental: boolean;
}

export const dnsProviderDescriptors: Record<DnsProviderId, DnsProviderDescriptor> = {
    CLOUDFLARE: {
        id: 'CLOUDFLARE',
        capabilities: { supportsProxy: true, supportsWildcard: true },
        credentialFields: [{ name: 'apiToken', secret: true }],
        experimental: false,
    },
    HETZNER: {
        id: 'HETZNER',
        capabilities: { supportsProxy: false, supportsWildcard: true },
        credentialFields: [{ name: 'apiToken', secret: true }],
        experimental: true,
    },
    DIGITALOCEAN: {
        id: 'DIGITALOCEAN',
        capabilities: { supportsProxy: false, supportsWildcard: true },
        credentialFields: [{ name: 'apiToken', secret: true }],
        experimental: true,
    },
    VULTR: {
        id: 'VULTR',
        capabilities: { supportsProxy: false, supportsWildcard: true },
        credentialFields: [{ name: 'apiToken', secret: true }],
        experimental: true,
    },
    LINODE: {
        id: 'LINODE',
        capabilities: { supportsProxy: false, supportsWildcard: true },
        credentialFields: [{ name: 'apiToken', secret: true }],
        experimental: true,
    },
    PORKBUN: {
        id: 'PORKBUN',
        capabilities: { supportsProxy: false, supportsWildcard: true },
        credentialFields: [
            { name: 'apiKey', secret: true },
            { name: 'secretApiKey', secret: true },
        ],
        experimental: true,
    },
    POWERDNS: {
        id: 'POWERDNS',
        capabilities: { supportsProxy: false, supportsWildcard: true },
        credentialFields: [
            { name: 'baseUrl', secret: false },
            { name: 'apiKey', secret: true },
            { name: 'serverId', secret: false, optional: true },
        ],
        experimental: true,
    },
    OVH: {
        id: 'OVH',
        capabilities: { supportsProxy: false, supportsWildcard: true },
        credentialFields: [
            { name: 'applicationKey', secret: true },
            { name: 'applicationSecret', secret: true },
            { name: 'consumerKey', secret: true },
            { name: 'endpoint', secret: false, optional: true },
        ],
        experimental: true,
    },
};

export const dnsConnectSchema = z
    .object({
        provider: dnsProviderIdSchema.default('CLOUDFLARE'),
        displayName: z
            .string()
            .min(1, 'Display name is required')
            .max(100, 'Display name must be at most 100 characters'),
        credentials: z.record(z.string(), z.string()).default({}),
    })
    .superRefine((data, ctx) => {
        for (const field of dnsProviderDescriptors[data.provider].credentialFields) {
            if (field.optional) continue;
            if (!data.credentials[field.name]?.trim()) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'required',
                    path: ['credentials', field.name],
                });
            }
        }
    });

export const dnsDeleteSchema = z.object({
    id: z.string().min(1),
});

export type DnsConnectInput = z.input<typeof dnsConnectSchema>;
export type DnsConnectValues = z.output<typeof dnsConnectSchema>;
export type DnsDeleteInput = z.infer<typeof dnsDeleteSchema>;
