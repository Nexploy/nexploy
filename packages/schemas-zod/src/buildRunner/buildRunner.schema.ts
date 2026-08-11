import { z } from 'zod';

const MAX_LABELS = 20;

export function parseRunnerLabels(value: string | undefined): string[] {
    return (value ?? '')
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean);
}

const runnerName = z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(64, 'Name must be at most 64 characters')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9 ._-]*$/, 'Use letters, digits, spaces, dots, dashes or underscores');

const runnerLabels = z
    .string()
    .max(500)
    .refine((value) => parseRunnerLabels(value).length <= MAX_LABELS, `At most ${MAX_LABELS} labels`)
    .refine(
        (value) => parseRunnerLabels(value).every((label) => label.length <= 32),
        'Each label must be at most 32 characters',
    );

const maxConcurrency = z.coerce.number().int().min(1, 'At least 1').max(64, 'At most 64');

export const createBuildRunnerSchema = z.object({
    name: runnerName,
    description: z.string().trim().max(255),
    labels: runnerLabels,
    maxConcurrency: maxConcurrency,
});

export const updateBuildRunnerSchema = z.object({
    id: z.string().min(1),
    name: runnerName,
    description: z.string().trim().max(255),
    labels: runnerLabels,
    maxConcurrency: maxConcurrency,
    enabled: z.boolean(),
});

export const deleteBuildRunnerSchema = z.object({
    id: z.string().min(1),
});

export const regenerateBuildRunnerTokenSchema = z.object({
    id: z.string().min(1),
});

export type CreateBuildRunnerInput = z.infer<typeof createBuildRunnerSchema>;
export type UpdateBuildRunnerInput = z.infer<typeof updateBuildRunnerSchema>;
export type DeleteBuildRunnerInput = z.infer<typeof deleteBuildRunnerSchema>;
export type RegenerateBuildRunnerTokenInput = z.infer<typeof regenerateBuildRunnerTokenSchema>;
