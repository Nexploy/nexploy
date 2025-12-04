import { z } from 'zod';

const domainSchema = z.object({
    id: z.string().optional(),
    host: z.string().min(1, 'Host requis'),
    path: z.string().default('/'),
    internalPath: z.string().default('/'),
    stripPath: z.boolean().default(false),
    containerPort: z.number().int().positive().default(3000),
    https: z.boolean().default(false),
});

export const domainsFormSchema = z.object({
    repositoryId: z.string(),
    domains: z.array(domainSchema),
    deletedIds: z.array(z.string()),
});

type DomainsFormValues = z.infer<typeof domainsFormSchema>;
