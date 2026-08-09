import ky from 'ky';
import type { DnsCredentialValues, DnsRecord, DnsRecordInput, DnsZone } from '@workspace/typescript-interface/dns/dns';
import { DnsProviderAdapter } from '@/services/dns/core/DnsProviderAdapter';
import { toRelativeEmptyRoot } from '@/services/dns/core/recordName';

const DEFAULT_TTL = 300;
const DOMAINS_PER_PAGE = 500;

interface LinodeDomain {
    id: number;
    domain: string;
    status: string;
}

interface LinodeRecord {
    id: number;
    type: string;
    name: string;
    target: string;
    ttl_sec: number;
}

function clientFor(credentials: DnsCredentialValues) {
    const apiToken = credentials.apiToken;
    if (!apiToken) {
        throw new Error('Missing Linode API token');
    }
    return ky.create({
        prefixUrl: 'https://api.linode.com/v4',
        headers: { Authorization: `Bearer ${apiToken}` },
    });
}

function toDnsRecord(payload: LinodeRecord): DnsRecord {
    return {
        id: String(payload.id),
        type: payload.type,
        name: payload.name,
        content: payload.target,
        ttl: payload.ttl_sec,
    };
}

function recordBody(input: DnsRecordInput) {
    return {
        type: 'A',
        name: toRelativeEmptyRoot(input),
        target: input.content,
        ttl_sec: DEFAULT_TTL,
    };
}

function recordsPath(zoneId: string, recordId?: string): string {
    const base = `domains/${encodeURIComponent(zoneId)}/records`;
    return recordId ? `${base}/${encodeURIComponent(recordId)}` : base;
}

export const linodeDnsAdapter: DnsProviderAdapter = {
    type: 'LINODE',

    capabilities: { supportsProxy: false, supportsWildcard: true },

    async verifyCredentials(credentials) {
        await clientFor(credentials)
            .get('domains', { searchParams: { page_size: 25 } })
            .json<{ data: LinodeDomain[] }>();
    },

    async listZones(credentials): Promise<DnsZone[]> {
        const response = await clientFor(credentials)
            .get('domains', { searchParams: { page_size: DOMAINS_PER_PAGE } })
            .json<{ data: LinodeDomain[] }>();

        return (response.data ?? []).map((domain) => ({
            id: String(domain.id),
            name: domain.domain,
            status: domain.status,
        }));
    },

    async createRecord(credentials, input) {
        const response = await clientFor(credentials)
            .post(recordsPath(input.zoneId), { json: recordBody(input) })
            .json<LinodeRecord>();

        return toDnsRecord(response);
    },

    async updateRecord(credentials, recordId, input) {
        const response = await clientFor(credentials)
            .put(recordsPath(input.zoneId, recordId), { json: recordBody(input) })
            .json<LinodeRecord>();

        return toDnsRecord(response);
    },

    async deleteRecord(credentials, zoneId, recordId) {
        await clientFor(credentials).delete(recordsPath(zoneId, recordId));
    },
};
