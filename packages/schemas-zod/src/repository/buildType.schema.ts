import { z } from 'zod';

export const buildTypeEnum = z.enum(['DOCKERFILE', 'DOCKER_COMPOSE', 'NIXPACKS', 'BUILDPACKS', 'NODE_PIPELINE']);

export const buildTypeSchema = z.object({
    buildType: buildTypeEnum,
    dockerfilePath: z.string().default('Dockerfile'),
    dockerComposePath: z.string().default('docker-compose.yml'),
    contextPath: z.string().default('.'),
    buildArgs: z
        .string()
        .optional()
        .transform((value) => (value === '' ? undefined : value)),
});

export type BuildType = z.infer<typeof buildTypeEnum>;
export type BuildTypeForm = z.infer<typeof buildTypeSchema>;
