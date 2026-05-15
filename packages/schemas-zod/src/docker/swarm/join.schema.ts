import { z } from 'zod';

export const swarmJoinSchema = (t: any) =>
    z.object({
        joinToken: z.string().min(1, t('fieldRequired', { field: t('fieldNames.joinToken') })),
        remoteAddrs: z.array(z.string().min(1)).min(1, t('atLeastOne')),
        advertiseAddr: z.string().min(1).optional(),
        listenAddr: z.string().optional(),
    });

export type SwarmJoinInput = z.infer<ReturnType<typeof swarmJoinSchema>>;
