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

export const instanceDomainSchema = z
    .object({
        domain: z.string().min(1, 'A domain or IP address is required'),
        useTls: z.boolean(),
        acmeEmail: z.string().email().optional(),
    })
    .refine((data) => !data.useTls || !!data.acmeEmail, {
        message: 'An email is required to enable HTTPS via Let\'s Encrypt',
        path: ['acmeEmail'],
    });

export type InstanceDomainInput = z.infer<typeof instanceDomainSchema>;

export const upgradeSchema = z.object({
    version: z.string().regex(/^[\w.\-]+$/, 'Invalid version format'),
});

export type UpgradeInput = z.infer<typeof upgradeSchema>;
