import ky from 'ky';
import type { DnsCredentialValues, DnsRecord, DnsRecordInput, DnsZone } from '@workspace/typescript-interface/dns/dns';
import { DnsProviderAdapter } from '@/services/dns/core/DnsProviderAdapter';
import { stripTrailingDot, toDottedFqdn, toRelativeAtRoot } from '@/services/dns/core/recordName';

const DEFAULT_TTL = 60;
const DEFAULT_SERVER_ID = 'localhost';

interface PowerDnsZone {
    id: string;
    name: string;
    kind: string;
}

function clientFor(credentials: DnsCredentialValues) {
    const { apiKey, baseUrl } = credentials;
    if (!(apiKey && baseUrl)) {
        throw new Error('Missing PowerDNS API key or base URL');
    }
    return ky.create({
        prefixUrl: `${baseUrl.replace(/\/+$/, '')}/api/v1`,
        headers: { 'X-API-Key': apiKey },
    });
}

function serverId(credentials: DnsCredentialValues): string {
    return credentials.serverId?.trim() || DEFAULT_SERVER_ID;
}

function zonesPath(credentials: DnsCredentialValues, zoneId?: string): string {
    const base = `servers/${encodeURIComponent(serverId(credentials))}/zones`;
    return zoneId ? `${base}/${encodeURIComponent(zoneId)}` : base;
}

function dottedName(zoneId: string, subdomain: string): string {
    const zone = zoneId.endsWith('.') ? zoneId : `${zoneId}.`;
    return subdomain === '@' ? zone : `${subdomain}.${zone}`;
}

async function patchRrset(
    credentials: DnsCredentialValues,
    zoneId: string,
    name: string,
    changetype: 'REPLACE' | 'DELETE',
    content?: string,
): Promise<void> {
    await clientFor(credentials).patch(zonesPath(credentials, zoneId), {
        json: {
            rrsets: [
                {
                    name,
                    type: 'A',
                    ttl: DEFAULT_TTL,
                    changetype,
                    records: changetype === 'REPLACE' ? [{ content, disabled: false }] : [],
                },
            ],
        },
    });
}

export const powerDnsAdapter: DnsProviderAdapter = {
    type: 'POWERDNS',

    capabilities: { supportsProxy: false, supportsWildcard: true },

    async verifyCredentials(credentials) {
        await clientFor(credentials).get(zonesPath(credentials)).json<PowerDnsZone[]>();
    },

    async listZones(credentials): Promise<DnsZone[]> {
        const zones = await clientFor(credentials).get(zonesPath(credentials)).json<PowerDnsZone[]>();

        return (zones ?? []).map((zone) => ({
            id: zone.id,
            name: stripTrailingDot(zone.name),
            status: zone.kind,
        }));
    },

    async createRecord(credentials, input) {
        await patchRrset(credentials, input.zoneId, toDottedFqdn(input), 'REPLACE', input.content);

        return {
            id: toRelativeAtRoot(input),
            type: 'A',
            name: toDottedFqdn(input),
            content: input.content,
            ttl: DEFAULT_TTL,
        };
    },

    async updateRecord(credentials, _recordId, input) {
        await patchRrset(credentials, input.zoneId, toDottedFqdn(input), 'REPLACE', input.content);

        return {
            id: toRelativeAtRoot(input),
            type: 'A',
            name: toDottedFqdn(input),
            content: input.content,
            ttl: DEFAULT_TTL,
        };
    },

    async deleteRecord(credentials, zoneId, recordId) {
        await patchRrset(credentials, zoneId, dottedName(zoneId, recordId), 'DELETE');
    },
};
