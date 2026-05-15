import { z } from 'zod';

export const githubSetupSchema = (t: any) =>
    z
        .object({
            displayName: z.string().min(1, { message: t('fieldRequired', { field: t('fieldNames.displayName') }) }),
            forOrg: z.boolean(),
            orgName: z.string(),
        })
        .refine((data) => !data.forOrg || data.orgName.length > 0, {
            path: ['orgName'],
            message: t('fieldRequired', { field: t('fieldNames.organizationName') }),
        });

export type GitHubSetupValues = z.infer<ReturnType<typeof githubSetupSchema>>;

export const githubSetupCallbackQuerySchema = z.object({
    code: z.string().optional(),
});
