import { z } from 'zod';

export const containerLabelSchema = (t: any) =>
    z.object({
        key: z.string().min(1, t('fieldRequired', { field: t('fieldNames.key') })),
        value: z.string(),
    });

export type ContainerLabelForm = z.infer<ReturnType<typeof containerLabelSchema>>;
