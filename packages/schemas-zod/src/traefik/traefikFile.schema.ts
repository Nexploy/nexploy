import { z } from 'zod';

const traefikYmlPath = z
    .string()
    .regex(/^(?!\/)(?!.*(^|\/)\.\.(\/|$))[\w.\-/]+\.yml$/, 'Invalid filename');

export const deleteTraefikFileSchema = z.object({
    filename: traefikYmlPath,
});

export const saveTraefikFileSchema = z.object({
    filename: traefikYmlPath,
    content: z.string(),
});

const traefikRelPath = z.string().regex(/^(?!\/)(?!.*(^|\/)\.\.(\/|$))[\w.\-/]+$/, 'Invalid path');

export const moveTraefikEntrySchema = z.object({
    source: traefikRelPath,
    destinationDir: z.union([z.literal(''), traefikRelPath]),
});
