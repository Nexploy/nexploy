import { z } from 'zod';

export const containerNetworkSchema = z.object({
    networkName: z.string().min(1, 'Le réseau est requis'),
});

export type ContainerNetworkForm = z.infer<typeof containerNetworkSchema>;
