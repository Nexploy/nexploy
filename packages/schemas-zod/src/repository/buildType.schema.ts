import { z } from 'zod';

export const buildTypeEnum = z.enum(['NODE_PIPELINE']);

export const buildTypeSchema = z.object({
    buildType: buildTypeEnum,
});

export type BuildType = z.infer<typeof buildTypeEnum>;
export type BuildTypeForm = z.infer<typeof buildTypeSchema>;
