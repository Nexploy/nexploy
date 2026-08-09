import type { DnsCredentialValues, DnsRecord, DnsRecordInput, DnsZone } from '@workspace/typescript-interface/dns/dns';
import { DnsProviderAdapter } from '@/services/dns/core/DnsProviderAdapter';
import {
    createHetznerClient,
    type HetznerRecordPayload,
    type HetznerRecordResponse,
    type HetznerZonesResponse,
} from '@/services/dns/providers/hetzner/hetzner.client';
import { toRelativeAtRoot } from '@/services/dns/core/recordName';

const DEFAULT_TTL = 60;
const ZONES_PER_PAGE = 100;

function clientFor(credentials: DnsCredentialValues) {
    const apiToken = credentials.apiToken;
    if (!apiToken) {
        throw new Error('Missing Hetzner DNS API token');
    }
    return createHetznerClient(apiToken);
}

function toDnsRecord(payload: HetznerRecordPayload): DnsRecord {
    return {
        id: payload.id,
        type: payload.type,
        name: payload.name,
        content: payload.value,
        ttl: payload.ttl ?? DEFAULT_TTL,
    };
}

function recordBody(input: DnsRecordInput) {
    return {
        zone_id: input.zoneId,
        type: 'A',
        name: toRelativeAtRoot(input),
        value: input.content,
        ttl: DEFAULT_TTL,
    };
}

export const hetznerDnsAdapter: DnsProviderAdapter = {
    type: 'HETZNER',

    capabilities: { supportsProxy: false, supportsWildcard: true },

    async verifyCredentials(credentials) {
        await clientFor(credentials)
            .get('zones', { searchParams: { per_page: 1 } })
            .json<HetznerZonesResponse>();
    },

    async listZones(credentials): Promise<DnsZone[]> {
        const response = await clientFor(credentials)
            .get('zones', { searchParams: { per_page: ZONES_PER_PAGE } })
            .json<HetznerZonesResponse>();

        return (response.zones ?? []).map((zone) => ({ id: zone.id, name: zone.name, status: zone.status }));
    },

    async createRecord(credentials, input) {
        const response = await clientFor(credentials)
            .post('records', { json: recordBody(input) })
            .json<HetznerRecordResponse>();

        return toDnsRecord(response.record);
    },

    async updateRecord(credentials, recordId, input) {
        const response = await clientFor(credentials)
            .put(`records/${recordId}`, { json: recordBody(input) })
            .json<HetznerRecordResponse>();

        return toDnsRecord(response.record);
    },

    async deleteRecord(credentials, _zoneId, recordId) {
        await clientFor(credentials).delete(`records/${recordId}`);
    },
};
