export type DnsProviderId =
    | 'CLOUDFLARE'
    | 'HETZNER'
    | 'DIGITALOCEAN'
    | 'VULTR'
    | 'LINODE'
    | 'PORKBUN'
    | 'POWERDNS'
    | 'OVH';

export interface DnsProviderCapabilities {
    supportsProxy: boolean;
    supportsWildcard: boolean;
}

export interface DnsZone {
    id: string;
    name: string;
    status: string;
}

export interface DnsRecord {
    id: string;
    type: string;
    name: string;
    content: string;
    ttl: number;
    proxied?: boolean;
}

export interface DnsAccountInfo {
    id: string;
    displayName: string;
    provider: DnsProviderId;
    serverIp: string;
    createdAt: Date;
}

export interface DnsCredentialValues {
    [field: string]: string;
}

export interface DnsRecordInput {
    zoneId: string;
    zoneName: string;
    subdomain: string;
    content: string;
    proxied: boolean;
}
