import { z } from 'zod';

export const domainSchema = z.object({
    id: z.string().optional(),
    host: z.string().min(1, 'Le domaine est requis'),
    path: z.string().min(1).default('/'),
    internalPath: z.string().min(1).default('/'),
    stripPath: z.boolean().default(false),
    containerPort: z.number().int().min(1).max(65535).default(3000),
    https: z.boolean().default(false),
    cloudflareZoneId: z.string().optional(),
    cloudflareZoneName: z.string().optional(),
    cloudflareDnsRecordId: z.string().optional(),
});

export const domainsFormSchema = z.object({
    domains: z.array(domainSchema),
    deletedIds: z.array(z.string()).default([]),
});

export const domainOperationsSchema = z.object({
    repositoryId: z.string(),
    add: z.array(domainSchema).default([]),
    edit: z.array(domainSchema).default([]),
    delete: z.array(domainSchema).default([]),
});

export type Domain = z.infer<typeof domainSchema>;
export type DomainsForm = z.infer<typeof domainsFormSchema>;
export type DomainOperations = z.infer<typeof domainOperationsSchema>;
