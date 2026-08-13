import ky, { type KyInstance } from 'ky';

export interface CloudflareResultInfo {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
}

export interface CloudflareApiResponse<T> {
    success: boolean;
    errors: Array<{ code: number; message: string }>;
    messages: string[];
    result: T;
    result_info?: CloudflareResultInfo;
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
