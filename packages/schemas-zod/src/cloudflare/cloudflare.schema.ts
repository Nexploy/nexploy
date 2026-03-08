import { z } from 'zod';

const ipv4Regex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const cloudflareConnectSchema = z.object({
    apiToken: z.string().min(1, 'API Token requis'),
    serverIp: z
        .string()
        .min(1, 'IP du serveur requise')
        .regex(ipv4Regex, 'Adresse IP invalide (format attendu: xxx.xxx.xxx.xxx)'),
});

export const cloudflareDisconnectSchema = z.object({});

export const cloudflareZonesSchema = z.object({});

export type CloudflareConnectInput = z.infer<typeof cloudflareConnectSchema>;
