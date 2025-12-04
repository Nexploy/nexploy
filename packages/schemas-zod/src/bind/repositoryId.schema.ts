import { z } from 'zod';

export const repositoryIdSchema: [repositoryId: z.ZodCUID] = [z.cuid()];
