export interface CloudflareZone {
    id: string;
    name: string;
    status: string;
}

export interface CloudflareDnsRecord {
    id: string;
    type: string;
    name: string;
    content: string;
    proxied: boolean;
    ttl: number;
}

export interface CloudflareApiResponse<T> {
    success: boolean;
    errors: Array<{ code: number; message: string }>;
    messages: string[];
    result: T;
}

export interface CloudflareCredentialInfo {
    isConnected: boolean;
    createdAt?: Date;
}

export interface CloudflareToken {
    apiToken: string;
}
