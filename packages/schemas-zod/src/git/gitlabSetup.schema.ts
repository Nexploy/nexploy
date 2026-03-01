import { z } from 'zod';

export const gitlabSetupSchema = z
    .object({
        provider: z.literal('gitlab'),
        displayName: z.string().min(1),
        clientId: z.string().min(1),
        clientSecret: z.string().min(1),
        useCustomUrl: z.boolean().default(false),
        baseUrl: z.url().optional().or(z.literal('')),
    })
    .refine((data) => !data.useCustomUrl || !!data.baseUrl, {
        message: 'Custom URL is required',
        path: ['baseUrl'],
    });
