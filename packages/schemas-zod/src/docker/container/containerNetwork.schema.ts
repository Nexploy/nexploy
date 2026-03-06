import { z } from 'zod';

export const containerNetworkSchema = z.object({
    networkName: z.string().min(1, 'Network is required'),
});

export type ContainerNetworkForm = z.infer<typeof containerNetworkSchema>;
