import { z } from 'zod';

// Relative path to a `.yml` file, optionally nested in folders.
// Disallows leading slash and `..` traversal segments.
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
