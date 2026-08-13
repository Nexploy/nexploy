import { HTTPError, type KyInstance } from 'ky';
import type { DnsCredentialValues, DnsRecord, DnsRecordInput, DnsZone } from '@workspace/typescript-interface/dns/dns';
import { DnsProviderAdapter } from '@/services/dns/core/DnsProviderAdapter';
import {
    createHetznerClient,
    type HetznerRrsetPayload,
    type HetznerRrsetResponse,
    type HetznerZonesResponse,
} from '@/services/dns/providers/hetzner/hetzner.client';
import { toRelativeAtRoot } from '@/services/dns/core/recordName';

const DEFAULT_TTL = 60;
const ZONES_PER_PAGE = 50;
const MAX_ZONE_PAGES = 20;
const RECORD_TYPE = 'A';

function clientFor(credentials: DnsCredentialValues) {
    const apiToken = credentials.apiToken;
    if (!apiToken) {
        throw new Error('Missing Hetzner Cloud API token');
    }
    return createHetznerClient(apiToken);
}

function rrsetsPath(zoneId: string, name?: string): string {
    const base = `zones/${encodeURIComponent(zoneId)}/rrsets`;
    return name ? `${base}/${encodeURIComponent(name)}/${RECORD_TYPE}` : base;
}

function rrsetName(recordId: string): string {
    return recordId.split('/')[0] || '@';
}

function toDnsRecord(payload: HetznerRrsetPayload): DnsRecord {
    return {
        id: payload.id ?? `${payload.name}/${payload.type}`,
        type: payload.type,
        name: payload.name,
        content: payload.records[0]?.value ?? '',
        ttl: payload.ttl ?? DEFAULT_TTL,
    };
}

function hasStatus(error: unknown, ...statuses: number[]): boolean {
    return error instanceof HTTPError && statuses.includes(error.response.status);
}

async function upsertRrset(client: KyInstance, zoneId: string, name: string, content: string): Promise<DnsRecord> {
    try {
        const response = await client
            .post(rrsetsPath(zoneId), {
                json: { name, type: RECORD_TYPE, ttl: DEFAULT_TTL, records: [{ value: content }] },
            })
            .json<HetznerRrsetResponse>();

        return toDnsRecord(response.rrset);
    } catch (error) {
        if (!hasStatus(error, 409, 422)) throw error;

        await client.post(`${rrsetsPath(zoneId, name)}/actions/set_records`, {
            json: { records: [{ value: content }] },
        });

        return { id: `${name}/${RECORD_TYPE}`, type: RECORD_TYPE, name, content, ttl: DEFAULT_TTL };
    }
}

async function deleteRrset(client: KyInstance, zoneId: string, name: string, ignoreMissing = false): Promise<void> {
    try {
        await client.delete(rrsetsPath(zoneId, name));
    } catch (error) {
        if (!(ignoreMissing && hasStatus(error, 404))) throw error;
    }
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
        const client = clientFor(credentials);
        const zones: DnsZone[] = [];
        let page = 1;

        while (page <= MAX_ZONE_PAGES) {
            const response = await client
                .get('zones', { searchParams: { page, per_page: ZONES_PER_PAGE } })
                .json<HetznerZonesResponse>();

            for (const zone of response.zones ?? []) {
                zones.push({ id: String(zone.id), name: zone.name, status: zone.status });
            }

            const nextPage = response.meta?.pagination?.next_page;
            if (!nextPage) break;
            page = nextPage;
        }

        return zones;
    },

    async createRecord(credentials, input) {
        return upsertRrset(clientFor(credentials), input.zoneId, toRelativeAtRoot(input), input.content);
    },

    async updateRecord(credentials, recordId, input) {
        const client = clientFor(credentials);
        const name = toRelativeAtRoot(input);
        const previousName = rrsetName(recordId);

        if (previousName !== name) {
            await deleteRrset(client, input.zoneId, previousName, true);
        }

        return upsertRrset(client, input.zoneId, name, input.content);
    },

    async deleteRecord(credentials, zoneId, recordId) {
        await deleteRrset(clientFor(credentials), zoneId, rrsetName(recordId));
    },
};
