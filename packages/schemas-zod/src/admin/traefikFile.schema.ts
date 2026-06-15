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

// Relative path to a file or folder (no extension requirement).
const traefikRelPath = z
    .string()
    .regex(/^(?!\/)(?!.*(^|\/)\.\.(\/|$))[\w.\-/]+$/, 'Invalid path');

export const moveTraefikEntrySchema = z.object({
    // File (`.yml`) or folder being moved.
    source: traefikRelPath,
    // Destination folder, empty string means the service root.
    destinationDir: z.union([z.literal(''), traefikRelPath]),
});
