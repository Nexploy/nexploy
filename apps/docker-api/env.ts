import { z } from 'zod';

const envSchema = z.object({
    DOCKER_SOCKET: z.string(),
    LOG_LEVEL: z.string(),
    PORT: z.coerce.number(),
    NEXPLOY_API_URL: z.string().default('http://localhost:3000'),
    INTERNAL_API_KEY: z.string({
        message:
            'INTERNAL_API_KEY is required. Generate one using: pnpm --filter=nexploy tsx scripts/generate-docker-api-key.ts <userId>',
    }),
});

export const env = envSchema.parse(process.env);
