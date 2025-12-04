import { z } from 'zod';

export const branchNameSchema = z.string().default('main');

export const branchSchema = z.object({
    branch: branchNameSchema,
});
