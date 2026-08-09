import ky from 'ky';
import type { DnsCredentialValues, DnsRecord, DnsRecordInput, DnsZone } from '@workspace/typescript-interface/dns/dns';
import { DnsProviderAdapter } from '@/services/dns/core/DnsProviderAdapter';
import { toRelativeEmptyRoot } from '@/services/dns/core/recordName';

const DEFAULT_TTL = 120;
const DOMAINS_PER_PAGE = 500;

interface VultrDomain {
    domain: string;
}

interface VultrRecord {
    id: string;
    type: string;
    name: string;
    data: string;
    ttl: number;
}

function clientFor(credentials: DnsCredentialValues) {
    const apiToken = credentials.apiToken;
    if (!apiToken) {
        throw new Error('Missing Vultr API token');
    }
    return ky.create({
        prefixUrl: 'https://api.vultr.com/v2',
        headers: { Authorization: `Bearer ${apiToken}` },
    });
}

function toDnsRecord(payload: VultrRecord): DnsRecord {
    return {
        id: payload.id,
        type: payload.type,
        name: payload.name,
        content: payload.data,
        ttl: payload.ttl,
    };
}

function recordBody(input: DnsRecordInput) {
    return {
        type: 'A',
        name: toRelativeEmptyRoot(input),
        data: input.content,
        ttl: DEFAULT_TTL,
    };
}

function recordsPath(zoneId: string, recordId?: string): string {
    const base = `domains/${encodeURIComponent(zoneId)}/records`;
    return recordId ? `${base}/${encodeURIComponent(recordId)}` : base;
}

export const vultrDnsAdapter: DnsProviderAdapter = {
    type: 'VULTR',

    capabilities: { supportsProxy: false, supportsWildcard: true },

    async verifyCredentials(credentials) {
        await clientFor(credentials)
            .get('domains', { searchParams: { per_page: 1 } })
            .json<{ domains: VultrDomain[] }>();
    },

    async listZones(credentials): Promise<DnsZone[]> {
        const response = await clientFor(credentials)
            .get('domains', { searchParams: { per_page: DOMAINS_PER_PAGE } })
            .json<{ domains: VultrDomain[] }>();

        return (response.domains ?? []).map((domain) => ({
            id: domain.domain,
            name: domain.domain,
            status: 'active',
        }));
    },

    async createRecord(credentials, input) {
        const response = await clientFor(credentials)
            .post(recordsPath(input.zoneId), { json: recordBody(input) })
            .json<{ record: VultrRecord }>();

        return toDnsRecord(response.record);
    },

    async updateRecord(credentials, recordId, input) {
        await clientFor(credentials).patch(recordsPath(input.zoneId, recordId), { json: recordBody(input) });

        return {
            id: recordId,
            type: 'A',
            name: toRelativeEmptyRoot(input),
            content: input.content,
            ttl: DEFAULT_TTL,
        };
    },

    async deleteRecord(credentials, zoneId, recordId) {
        await clientFor(credentials).delete(recordsPath(zoneId, recordId));
    },
};
