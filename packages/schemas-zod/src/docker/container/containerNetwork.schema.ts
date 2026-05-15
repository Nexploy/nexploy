import { z } from 'zod';

export const containerNetworkSchema = (t: any) =>
    z.object({
        networkName: z.string().min(1, t('fieldRequired', { field: t('fieldNames.network') })),
    });

export type ContainerNetworkForm = z.infer<ReturnType<typeof containerNetworkSchema>>;
