import { z } from 'zod';

const httpUrl = z
    .string()
    .min(1)
    .refine((v) => {
        try {
            return ['http:', 'https:'].includes(new URL(v).protocol);
        } catch {
            return false;
        }
    }, 'Repository URL must be a valid http(s) URL');

export const repositoryCreateFormSchema = z
    .object({
        name: z.string(),
        repo: z.object(
            {
                id: z.string({ error: 'Repository is required' }).min(1, 'Repository is required'),
                name: z.string().min(1),
                fullName: z.string().min(1),
                url: httpUrl,
                private: z.boolean(),
                defaultBranch: z.string({ error: 'Branch is required' }).min(1, 'Branch is required'),
            },
            { error: 'Repository is required' },
        ),
        gitProvider: z.enum(['GITHUB', 'GITLAB', 'GITEA', 'BITBUCKET', 'AZURE_REPOS', 'CUSTOM']),
        gitAccountId: z.string().optional(),
    })
    .superRefine((value, ctx) => {
        if (value.gitProvider === 'CUSTOM') return;

        if (!value.gitAccountId) {
            ctx.addIssue({
                code: 'custom',
                path: ['gitAccountId'],
                message: 'Git account is required',
            });
        }
    });

export const customRepositoryUrlSchema = z.object({
    repositoryUrl: httpUrl,
});

export type RepositoryCreateForm = z.infer<typeof repositoryCreateFormSchema>;
export type CustomRepositoryUrlInput = z.infer<typeof customRepositoryUrlSchema>;
