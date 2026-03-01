import { z } from 'zod';

export const getRepositoriesSchema = z.object({
    provider: z.enum(['github', 'gitlab']),
});

export const getBranchesSchema = z.object({
    provider: z.enum(['github', 'gitlab']),
    repoId: z.string(),
    owner: z.string().optional(),
    repoName: z.string().optional(),
});

export const deleteGitProviderSchema = z.object({
    id: z.string(),
});

export type GetRepositoriesInput = z.infer<typeof getRepositoriesSchema>;
export type GetBranchesInput = z.infer<typeof getBranchesSchema>;
export type DeleteGitProviderInput = z.infer<typeof deleteGitProviderSchema>;
