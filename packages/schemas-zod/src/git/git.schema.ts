import { z } from 'zod';

export const getRepositoriesSchema = z.object({
    provider: z.enum(['GITHUB', 'GITLAB', 'GITEA']),
    gitAccountId: z.string().min(1),
});

export const getBranchesSchema = z.object({
    provider: z.enum(['GITHUB', 'GITLAB', 'GITEA']),
    repoId: z.string().min(1),
    owner: z.string().min(1),
    repoName: z.string().min(1),
    gitAccountId: z.string().min(1),
});

export const deleteGitProviderSchema = z.object({
    id: z.string(),
});

export type GetRepositoriesInput = z.infer<typeof getRepositoriesSchema>;
export type GetBranchesInput = z.infer<typeof getBranchesSchema>;
export type DeleteGitProviderInput = z.infer<typeof deleteGitProviderSchema>;
