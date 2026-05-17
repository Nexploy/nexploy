import { z } from 'zod';

export const containerVolumeSchema = z.object({
    hostPath: z.string().min(1, 'Host path is required'),
    containerPath: z.string().min(1, 'Container path is required'),
    readOnly: z.boolean(),
});

export type ContainerVolumeForm = z.infer<typeof containerVolumeSchema>;
