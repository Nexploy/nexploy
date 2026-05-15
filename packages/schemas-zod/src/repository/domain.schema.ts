import { z } from 'zod';

export const domainSchema = (t: any) =>
    z.object({
        id: z.string().optional(),
        host: z.string().min(1, t('fieldRequired', { field: t('fieldNames.host') })),
        path: z.string().min(1).default('/'),
        internalPath: z.string().min(1).default('/'),
        stripPath: z.boolean().default(false),
        containerPort: z.number().int().min(1).max(65535).default(3000),
        https: z.boolean().default(false),
        environmentId: z.string().optional(),
        cloudflareCredentialId: z.string().optional(),
        cloudflareZoneId: z.string().optional(),
        cloudflareZoneName: z.string().optional(),
        cloudflareDnsRecordId: z.string().optional(),
    });

export const domainsFormSchema = (t: any) =>
    z.object({
        domains: z.array(domainSchema(t)),
        deletedIds: z.array(z.string()).default([]),
    });

export const domainOperationsSchema = (t: any) =>
    z.object({
        repositoryId: z.string(),
        add: z.array(domainSchema(t)).default([]),
        edit: z.array(domainSchema(t)).default([]),
        delete: z.array(domainSchema(t)).default([]),
    });

export type Domain = z.infer<ReturnType<typeof domainSchema>>;
export type DomainsForm = z.infer<ReturnType<typeof domainsFormSchema>>;
export type DomainOperations = z.infer<ReturnType<typeof domainOperationsSchema>>;
