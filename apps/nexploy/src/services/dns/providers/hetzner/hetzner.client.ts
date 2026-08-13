import ky, { type KyInstance } from 'ky';

export interface HetznerZonePayload {
    id: number;
    name: string;
    status: string;
}

export interface HetznerRecordValue {
    value: string;
    comment?: string;
}

export interface HetznerRrsetPayload {
    id: string;
    name: string;
    type: string;
    ttl: number | null;
    records: HetznerRecordValue[];
}

export interface HetznerPaginationMeta {
    pagination?: {
        page: number;
        per_page: number;
        next_page: number | null;
    };
}

export interface HetznerZonesResponse {
    zones: HetznerZonePayload[];
    meta?: HetznerPaginationMeta;
}

export interface HetznerRrsetResponse {
    rrset: HetznerRrsetPayload;
}

export function createHetznerClient(apiToken: string): KyInstance {
    return ky.create({
        prefixUrl: 'https://api.hetzner.cloud/v1',
        headers: { Authorization: `Bearer ${apiToken}` },
    });
}
