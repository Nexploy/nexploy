import { z } from 'zod';

export const containerLabelSchema = z.object({
    key: z.string().min(1, 'La clé est requise'),
    value: z.string(),
});

export type ContainerLabelForm = z.infer<typeof containerLabelSchema>;
