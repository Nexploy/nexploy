import { z } from 'zod';

export const containerVolumeSchema = (t: any) =>
    z.object({
        hostPath: z.string().min(1, t('fieldRequired', { field: t('fieldNames.hostPath') })),
        containerPath: z.string().min(1, t('fieldRequired', { field: t('fieldNames.containerPath') })),
        readOnly: z.boolean(),
    });

export type ContainerVolumeForm = z.infer<ReturnType<typeof containerVolumeSchema>>;
