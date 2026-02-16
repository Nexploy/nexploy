import { z } from 'zod';

export const gitProviderEnum = z.enum(['github', 'gitlab']);

export const gitlabProviderSchema = z.object({
    provider: z.literal('gitlab'),
    displayName: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
});

export const deleteGitProviderSchema = z.object({
    id: z.string().min(1),
});

export type GitLabProviderInput = z.infer<typeof gitlabProviderSchema>;
export type DeleteGitProviderInput = z.infer<typeof deleteGitProviderSchema>;
