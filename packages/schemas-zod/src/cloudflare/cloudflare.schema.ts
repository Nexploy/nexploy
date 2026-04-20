import { z } from 'zod';

export const cloudflareConnectSchema = z.object({
    displayName: z.string().min(1, 'Display name requis'),
    apiToken: z.string().min(1, 'API Token requis'),
});

export const cloudflareDeleteSchema = z.object({
    id: z.string().min(1),
});

export type CloudflareConnectInput = z.infer<typeof cloudflareConnectSchema>;
export type CloudflareDeleteInput = z.infer<typeof cloudflareDeleteSchema>;
