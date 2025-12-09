import { z } from 'zod';

export const containerVolumeSchema = z.object({
    hostPath: z.string().min(1, 'Le chemin hôte est requis'),
    containerPath: z.string().min(1, 'Le chemin du conteneur est requis'),
    readOnly: z.boolean(),
});

export type ContainerVolumeForm = z.infer<typeof containerVolumeSchema>;
