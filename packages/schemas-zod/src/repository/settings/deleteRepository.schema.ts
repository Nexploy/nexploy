import { z } from 'zod';

export const deleteRepositorySchema = z.object({
    repositoryId: z.string(),
});
