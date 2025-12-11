import { z } from 'zod';

export const cloudflareConnectSchema = z.object({
    apiToken: z.string().min(1, 'API Token is required'),
});

export const cloudflareDisconnectSchema = z.object({});

export const cloudflareZonesSchema = z.object({});

export type CloudflareConnectInput = z.infer<typeof cloudflareConnectSchema>;
