import ky, { type KyInstance } from 'ky';

export interface DigitalOceanDomainPayload {
    name: string;
    ttl: number | null;
}

export interface DigitalOceanRecordPayload {
    id: number;
    type: string;
    name: string;
    data: string;
    ttl: number;
}

export interface DigitalOceanDomainsResponse {
    domains: DigitalOceanDomainPayload[];
    links?: { pages?: { next?: string } };
}

export interface DigitalOceanRecordResponse {
    domain_record: DigitalOceanRecordPayload;
}

export function createDigitalOceanClient(apiToken: string): KyInstance {
    return ky.create({
        prefixUrl: 'https://api.digitalocean.com/v2',
        headers: { Authorization: `Bearer ${apiToken}` },
    });
}
