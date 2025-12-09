import { z } from 'zod';

export const containerEnvSchema = z.object({
    key: z.string(),
    value: z.string(),
});

export type ContainerEnvForm = z.infer<typeof containerEnvSchema>;
