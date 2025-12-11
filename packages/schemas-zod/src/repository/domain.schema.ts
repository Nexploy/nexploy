import { z } from 'zod';

export const domainSchema = z.object({
    id: z.string().optional(),
    host: z.string().min(1, 'Le domaine est requis'),
    path: z.string().min(1),
    internalPath: z.string().min(1),
    stripPath: z.boolean(),
    containerPort: z.number().int().min(1).max(65535),
    https: z.boolean(),
    cloudflareZoneId: z.string().optional(),
    cloudflareZoneName: z.string().optional(),
    cloudflareDnsRecordId: z.string().optional(),
});

export const domainsFormSchema = z.object({
    domains: z.array(domainSchema),
    deletedIds: z.array(z.string()),
});

export type DomainFormValues = z.infer<typeof domainSchema>;
export type DomainsFormValues = z.infer<typeof domainsFormSchema>;
