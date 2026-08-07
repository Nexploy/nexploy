import { z } from 'zod';

export const gitlabSetupSchema = z
    .object({
        provider: z.literal('gitlab'),
        displayName: z.string().min(1).max(100, 'Display name must be at most 100 characters'),
        clientId: z.string().min(1),
        clientSecret: z.string().min(1),
        useCustomUrl: z.boolean().default(false),
        baseUrl: z.url().optional().or(z.literal('')),
    })
    .refine((data) => !data.useCustomUrl || !!data.baseUrl, {
        message: 'Base URL is required',
        path: ['baseUrl'],
    });
