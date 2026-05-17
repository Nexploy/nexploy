import { z } from 'zod';

export const githubSetupSchema = z
    .object({
        displayName: z.string().min(1, { message: 'Display name is required' }),
        forOrg: z.boolean(),
        orgName: z.string(),
    })
    .refine((data) => !data.forOrg || data.orgName.length > 0, {
        path: ['orgName'],
        message: 'Organization name is required',
    });

export type GitHubSetupValues = z.infer<typeof githubSetupSchema>;

export const githubSetupCallbackQuerySchema = z.object({
    code: z.string().optional(),
});
