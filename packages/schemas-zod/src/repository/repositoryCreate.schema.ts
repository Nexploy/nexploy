import { z } from 'zod';

export const repositoryCreateFormSchema = (t: any) =>
    z.object({
        name: z.string().optional(),
        repo: z.object({
            id: z.string({ error: t('fieldRequired', { field: t('fieldNames.repository') }) }).min(1, t('fieldRequired', { field: t('fieldNames.repository') })),
            name: z.string().min(1),
            fullName: z.string().min(1),
            url: z.string().min(1),
            private: z.boolean(),
            defaultBranch: z.string({ error: t('fieldRequired', { field: t('fieldNames.branch') }) }).min(1, t('fieldRequired', { field: t('fieldNames.branch') })),
        }, { error: t('fieldRequired', { field: t('fieldNames.repository') }) }),
        gitProvider: z.enum(['github', 'gitlab', 'manual']),
        gitAccountId: z.string({ error: t('fieldRequired', { field: t('fieldNames.gitAccount') }) }).min(1, t('fieldRequired', { field: t('fieldNames.gitAccount') })),
    });

export type RepositoryCreateForm = z.infer<ReturnType<typeof repositoryCreateFormSchema>>;
