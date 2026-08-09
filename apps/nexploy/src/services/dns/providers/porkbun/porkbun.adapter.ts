import ky from 'ky';
import type { DnsCredentialValues, DnsRecord, DnsRecordInput, DnsZone } from '@workspace/typescript-interface/dns/dns';
import { DnsProviderAdapter } from '@/services/dns/core/DnsProviderAdapter';
import { toRelativeEmptyRoot } from '@/services/dns/core/recordName';

const MINIMUM_TTL = 600;

interface PorkbunDomain {
    domain: string;
    status: string;
}

interface PorkbunResponse {
    status: string;
    message?: string;
}

function clientFor(credentials: DnsCredentialValues) {
    const { apiKey, secretApiKey } = credentials;
    if (!(apiKey && secretApiKey)) {
        throw new Error('Missing Porkbun API credentials');
    }
    return ky.create({
        prefixUrl: 'https://api.porkbun.com/api/json/v3',
        headers: {
            'X-API-Key': apiKey,
            'X-Secret-API-Key': secretApiKey,
        },
    });
}

function assertSuccess(response: PorkbunResponse): void {
    if (response.status !== 'SUCCESS') {
        throw new Error(response.message ?? 'Porkbun API returned an error');
    }
}

function recordBody(input: DnsRecordInput) {
    return {
        name: toRelativeEmptyRoot(input),
        type: 'A',
        content: input.content,
        ttl: String(MINIMUM_TTL),
    };
}

export const porkbunDnsAdapter: DnsProviderAdapter = {
    type: 'PORKBUN',

    capabilities: { supportsProxy: false, supportsWildcard: true },

    async verifyCredentials(credentials) {
        const response = await clientFor(credentials)
            .post('domain/listAll', { json: {} })
            .json<PorkbunResponse & { domains?: PorkbunDomain[] }>();
        assertSuccess(response);
    },

    async listZones(credentials): Promise<DnsZone[]> {
        const response = await clientFor(credentials)
            .post('domain/listAll', { json: {} })
            .json<PorkbunResponse & { domains?: PorkbunDomain[] }>();
        assertSuccess(response);

        return (response.domains ?? []).map((domain) => ({
            id: domain.domain,
            name: domain.domain,
            status: domain.status,
        }));
    },

    async createRecord(credentials, input) {
        const response = await clientFor(credentials)
            .post(`dns/create/${encodeURIComponent(input.zoneId)}`, { json: recordBody(input) })
            .json<PorkbunResponse & { id?: string | number }>();
        assertSuccess(response);

        return {
            id: String(response.id),
            type: 'A',
            name: toRelativeEmptyRoot(input),
            content: input.content,
            ttl: MINIMUM_TTL,
        };
    },

    async updateRecord(credentials, recordId, input) {
        const response = await clientFor(credentials)
            .post(`dns/edit/${encodeURIComponent(input.zoneId)}/${encodeURIComponent(recordId)}`, {
                json: recordBody(input),
            })
            .json<PorkbunResponse>();
        assertSuccess(response);

        return {
            id: recordId,
            type: 'A',
            name: toRelativeEmptyRoot(input),
            content: input.content,
            ttl: MINIMUM_TTL,
        };
    },

    async deleteRecord(credentials, zoneId, recordId) {
        const response = await clientFor(credentials)
            .post(`dns/delete/${encodeURIComponent(zoneId)}/${encodeURIComponent(recordId)}`, { json: {} })
            .json<PorkbunResponse>();
        assertSuccess(response);
    },
};
