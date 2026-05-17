import { z } from 'zod';

export const cloudflareConnectSchema = z.object({
    displayName: z.string().min(1, 'Display name is required'),
    apiToken: z.string().min(1, 'API token is required'),
});

export const cloudflareDeleteSchema = z.object({
    id: z.string().min(1),
});

export type CloudflareConnectInput = z.infer<typeof cloudflareConnectSchema>;
export type CloudflareDeleteInput = z.infer<typeof cloudflareDeleteSchema>;
