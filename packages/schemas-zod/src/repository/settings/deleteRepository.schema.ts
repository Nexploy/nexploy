import { z } from 'zod';

export const deleteRepositorySchema = z.object({
    repositoryId: z.string(),
    confirmName: z.string(),
});

export type DeleteRepositoryInput = z.infer<typeof deleteRepositorySchema>;
