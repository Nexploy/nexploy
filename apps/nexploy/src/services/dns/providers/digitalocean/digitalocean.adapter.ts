import type { DnsCredentialValues, DnsRecord, DnsRecordInput, DnsZone } from '@workspace/typescript-interface/dns/dns';
import { DnsProviderAdapter } from '@/services/dns/core/DnsProviderAdapter';
import {
    createDigitalOceanClient,
    type DigitalOceanDomainsResponse,
    type DigitalOceanRecordPayload,
    type DigitalOceanRecordResponse,
} from '@/services/dns/providers/digitalocean/digitalocean.client';
import { toRelativeAtRoot } from '@/services/dns/core/recordName';

const DEFAULT_TTL = 60;
const DOMAINS_PER_PAGE = 200;

function clientFor(credentials: DnsCredentialValues) {
    const apiToken = credentials.apiToken;
    if (!apiToken) {
        throw new Error('Missing DigitalOcean API token');
    }
    return createDigitalOceanClient(apiToken);
}

function toDnsRecord(payload: DigitalOceanRecordPayload): DnsRecord {
    return {
        id: String(payload.id),
        type: payload.type,
        name: payload.name,
        content: payload.data,
        ttl: payload.ttl,
    };
}

function recordBody(input: DnsRecordInput) {
    return {
        type: 'A',
        name: toRelativeAtRoot(input),
        data: input.content,
        ttl: DEFAULT_TTL,
    };
}

function recordsPath(zoneId: string, recordId?: string): string {
    const base = `domains/${encodeURIComponent(zoneId)}/records`;
    return recordId ? `${base}/${encodeURIComponent(recordId)}` : base;
}

export const digitalOceanDnsAdapter: DnsProviderAdapter = {
    type: 'DIGITALOCEAN',

    capabilities: { supportsProxy: false, supportsWildcard: true },

    async verifyCredentials(credentials) {
        await clientFor(credentials)
            .get('domains', { searchParams: { per_page: 1 } })
            .json<DigitalOceanDomainsResponse>();
    },

    async listZones(credentials): Promise<DnsZone[]> {
        const response = await clientFor(credentials)
            .get('domains', { searchParams: { per_page: DOMAINS_PER_PAGE } })
            .json<DigitalOceanDomainsResponse>();

        return (response.domains ?? []).map((domain) => ({
            id: domain.name,
            name: domain.name,
            status: 'active',
        }));
    },

    async createRecord(credentials, input) {
        const response = await clientFor(credentials)
            .post(recordsPath(input.zoneId), { json: recordBody(input) })
            .json<DigitalOceanRecordResponse>();

        return toDnsRecord(response.domain_record);
    },

    async updateRecord(credentials, recordId, input) {
        const response = await clientFor(credentials)
            .put(recordsPath(input.zoneId, recordId), { json: recordBody(input) })
            .json<DigitalOceanRecordResponse>();

        return toDnsRecord(response.domain_record);
    },

    async deleteRecord(credentials, zoneId, recordId) {
        await clientFor(credentials).delete(recordsPath(zoneId, recordId));
    },
};
