import ky, { type KyInstance } from 'ky';

export interface HetznerZonePayload {
    id: string;
    name: string;
    status: string;
}

export interface HetznerRecordPayload {
    id: string;
    type: string;
    name: string;
    value: string;
    ttl?: number;
    zone_id: string;
}

export interface HetznerZonesResponse {
    zones: HetznerZonePayload[];
}

export interface HetznerRecordResponse {
    record: HetznerRecordPayload;
}

export function createHetznerClient(apiToken: string): KyInstance {
    return ky.create({
        prefixUrl: 'https://dns.hetzner.com/api/v1',
        headers: { 'Auth-API-Token': apiToken },
    });
}
