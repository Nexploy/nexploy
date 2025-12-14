import { z } from 'zod';

const envSchema = z.object({
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.url(),
    DATABASE_URL: z.string(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    GITLAB_CLIENT_ID: z.string(),
    GITLAB_CLIENT_SECRET: z.string(),
    DOCKER_API_URL: z.url(),
    AI_KEY: z.string(),
    DEPLOYER_WORK_DIR: z.string(),
    ENCRYPTION_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
