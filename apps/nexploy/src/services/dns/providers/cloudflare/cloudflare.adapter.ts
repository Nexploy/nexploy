import type { DnsCredentialValues, DnsRecord, DnsRecordInput, DnsZone } from '@workspace/typescript-interface/dns/dns';
import { DnsProviderAdapter } from '@/services/dns/core/DnsProviderAdapter';
import {
    type CloudflareApiResponse,
    type CloudflareDnsRecordPayload,
    type CloudflareZonePayload,
    createCloudflareClient,
} from '@/services/dns/providers/cloudflare/cloudflare.client';
import { toFqdn } from '@/services/dns/core/recordName';

const ZONES_PER_PAGE = 50;
const MAX_ZONE_PAGES = 20;

function clientFor(credentials: DnsCredentialValues) {
    const apiToken = credentials.apiToken;
    if (!apiToken) {
        throw new Error('Missing Cloudflare API token');
    }
    return createCloudflareClient(apiToken);
}

function toDnsRecord(payload: CloudflareDnsRecordPayload): DnsRecord {
    return {
        id: payload.id,
        type: payload.type,
        name: payload.name,
        content: payload.content,
        ttl: payload.ttl,
        proxied: payload.proxied,
    };
}

function recordBody(input: DnsRecordInput) {
    return {
        type: 'A',
        name: toFqdn(input),
        content: input.content,
        proxied: input.proxied,
        ttl: 1,
    };
}

export const cloudflareDnsAdapter: DnsProviderAdapter = {
    type: 'CLOUDFLARE',

    capabilities: { supportsProxy: true, supportsWildcard: true },

    async verifyCredentials(credentials) {
        await clientFor(credentials)
            .get('zones', { searchParams: { per_page: 1 } })
            .json<CloudflareApiResponse<CloudflareZonePayload[]>>();
    },

    async listZones(credentials): Promise<DnsZone[]> {
        const client = clientFor(credentials);
        const zones: DnsZone[] = [];
        let page = 1;

        while (page <= MAX_ZONE_PAGES) {
            const response = await client
                .get('zones', { searchParams: { page, per_page: ZONES_PER_PAGE } })
                .json<CloudflareApiResponse<CloudflareZonePayload[]>>();

            for (const zone of response.result ?? []) {
                zones.push({ id: zone.id, name: zone.name, status: zone.status });
            }

            const totalPages = response.result_info?.total_pages ?? 1;
            if (page >= totalPages) break;
            page += 1;
        }

        return zones;
    },

    async createRecord(credentials, input) {
        const response = await clientFor(credentials)
            .post(`zones/${input.zoneId}/dns_records`, { json: recordBody(input) })
            .json<CloudflareApiResponse<CloudflareDnsRecordPayload>>();

        return toDnsRecord(response.result);
    },

    async updateRecord(credentials, recordId, input) {
        const response = await clientFor(credentials)
            .patch(`zones/${input.zoneId}/dns_records/${recordId}`, { json: recordBody(input) })
            .json<CloudflareApiResponse<CloudflareDnsRecordPayload>>();

        return toDnsRecord(response.result);
    },

    async deleteRecord(credentials, zoneId, recordId) {
        await clientFor(credentials)
            .delete(`zones/${zoneId}/dns_records/${recordId}`)
            .json<CloudflareApiResponse<{ id: string }>>();
    },
};
