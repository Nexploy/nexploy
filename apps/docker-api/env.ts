import { z } from 'zod';

const envSchema = z.object({
    DOCKER_SOCKET: z.string(),
    LOG_LEVEL: z.string(),
    PORT: z.coerce.number(),
});

export const env = envSchema.parse(process.env);
