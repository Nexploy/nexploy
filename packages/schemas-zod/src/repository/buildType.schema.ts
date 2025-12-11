import { z } from 'zod';

export const buildTypeEnum = z.enum(['DOCKERFILE', 'DOCKER_COMPOSE', 'NIXPACKS', 'BUILDPACKS']);

export const buildTypeSchema = z.object({
    buildType: buildTypeEnum,
});

export type BuildType = z.infer<typeof buildTypeEnum>;
