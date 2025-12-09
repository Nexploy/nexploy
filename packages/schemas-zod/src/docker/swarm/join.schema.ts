import { z } from 'zod';

export const swarmJoinSchema = z.object({
    joinToken: z.string().min(1, 'Join token is required'),
    remoteAddrs: z.array(z.string().min(1)).min(1, 'At least one manager address is required'),
    advertiseAddr: z.string().min(1).optional(),
});

export type SwarmJoinInput = z.infer<typeof swarmJoinSchema>;
