import { z } from 'zod';

export const domainSchema = z
    .object({
        id: z.string().optional(),
        host: z.string().min(1, 'Host is required'),
        path: z.string().min(1).default('/'),
        internalPath: z.string().min(1).default('/'),
        stripPath: z.boolean().default(false),
        containerName: z.string(),
        containerPort: z.number().min(1).max(65535).default(3000),
        https: z.boolean().default(false),
        certificateId: z.string().optional(),
        environmentId: z.string({ error: 'Environment is required' }),
        cloudflareCredentialId: z.string().optional(),
        cloudflareZoneId: z.string().optional(),
        cloudflareZoneName: z.string().optional(),
        cloudflareDnsRecordId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.https && !data.certificateId) {
            ctx.addIssue({
                code: 'custom',
                message: 'certificateRequired',
                path: ['certificateId'],
            });
        }
    });

export const domainFormSchema = z.object({
    domain: domainSchema,
});

export const domainOperationsSchema = z.object({
    repositoryId: z.string(),
    add: z.array(domainSchema).default([]),
    edit: z.array(domainSchema).default([]),
    delete: z.array(domainSchema).default([]),
});

export const deleteDomainSchema = z.object({
    domainId: z.string(),
});

export type Domain = z.infer<typeof domainSchema>;
export type DomainFormValues = z.infer<typeof domainFormSchema>;
export type DomainOperations = z.infer<typeof domainOperationsSchema>;

export type DomainFormInput = z.input<typeof domainFormSchema>;
export type DomainFormOutput = z.output<typeof domainFormSchema>;
