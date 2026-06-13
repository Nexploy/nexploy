import { z } from 'zod';

export const deleteTraefikFileSchema = z.object({
    filename: z.string().regex(/^[\w.-]+\.yml$/, 'Invalid filename'),
});

export const saveTraefikFileSchema = z.object({
    filename: z.string().regex(/^[\w.-]+\.yml$/, 'Invalid filename'),
    content: z.string(),
});
