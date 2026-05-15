import { z } from 'zod';

export const cloudflareConnectSchema = (t: any) =>
    z.object({
        displayName: z.string().min(1, t('fieldRequired', { field: t('fieldNames.displayName') })),
        apiToken: z.string().min(1, t('fieldRequired', { field: t('fieldNames.apiToken') })),
    });

export const cloudflareDeleteSchema = z.object({
    id: z.string().min(1),
});

export type CloudflareConnectInput = z.infer<ReturnType<typeof cloudflareConnectSchema>>;
export type CloudflareDeleteInput = z.infer<typeof cloudflareDeleteSchema>;
