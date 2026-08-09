import ky, { type KyInstance } from 'ky';

export interface CloudflareApiResponse<T> {
    success: boolean;
    errors: Array<{ code: number; message: string }>;
    messages: string[];
    result: T;
}

export interface CloudflareZonePayload {
    id: string;
    name: string;
    status: string;
}

export interface CloudflareDnsRecordPayload {
    id: string;
    type: string;
    name: string;
    content: string;
    proxied: boolean;
    ttl: number;
}

export function createCloudflareClient(apiToken: string): KyInstance {
    return ky.create({
        prefixUrl: 'https://api.cloudflare.com/client/v4',
        headers: { Authorization: `Bearer ${apiToken}` },
    });
}
