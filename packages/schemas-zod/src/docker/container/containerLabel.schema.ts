import { z } from 'zod';

export const containerLabelSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string(),
});

export type ContainerLabelForm = z.infer<typeof containerLabelSchema>;
