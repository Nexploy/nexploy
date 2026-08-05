import { z } from 'zod';

export const deleteEnvVariableSchema = z.object({
    repositoryId: z.string(),
    envVariableId: z.string(),
});

export type DeleteEnvVariableInput = z.infer<typeof deleteEnvVariableSchema>;
