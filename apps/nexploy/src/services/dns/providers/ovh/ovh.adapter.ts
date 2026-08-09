import type { DnsZone } from '@workspace/typescript-interface/dns/dns';
import { DnsProviderAdapter } from '@/services/dns/core/DnsProviderAdapter';
import { ovhRequest, readOvhCredentials } from '@/services/dns/providers/ovh/ovh.client';
import { toRelativeEmptyRoot } from '@/services/dns/core/recordName';

const DEFAULT_TTL = 60;

interface OvhRecord {
    id: number;
    fieldType: string;
    subDomain: string;
    target: string;
    ttl: number;
}

function zonePath(zoneId: string, suffix = ''): string {
    return `/domain/zone/${encodeURIComponent(zoneId)}${suffix}`;
}

async function refreshZone(credentials: ReturnType<typeof readOvhCredentials>, zoneId: string): Promise<void> {
    await ovhRequest(credentials, 'POST', zonePath(zoneId, '/refresh'));
}

export const ovhDnsAdapter: DnsProviderAdapter = {
    type: 'OVH',

    capabilities: { supportsProxy: false, supportsWildcard: true },

    async verifyCredentials(credentials) {
        await ovhRequest<string[]>(readOvhCredentials(credentials), 'GET', '/domain/zone');
    },

    async listZones(credentials): Promise<DnsZone[]> {
        const zones = await ovhRequest<string[]>(readOvhCredentials(credentials), 'GET', '/domain/zone');

        return (zones ?? []).map((zone) => ({ id: zone, name: zone, status: 'active' }));
    },

    async createRecord(credentials, input) {
        const ovhCredentials = readOvhCredentials(credentials);
        const subDomain = toRelativeEmptyRoot(input);

        const record = await ovhRequest<OvhRecord>(ovhCredentials, 'POST', zonePath(input.zoneId, '/record'), {
            fieldType: 'A',
            subDomain,
            target: input.content,
            ttl: DEFAULT_TTL,
        });

        await refreshZone(ovhCredentials, input.zoneId);

        return {
            id: String(record.id),
            type: 'A',
            name: subDomain,
            content: input.content,
            ttl: DEFAULT_TTL,
        };
    },

    async updateRecord(credentials, recordId, input) {
        const ovhCredentials = readOvhCredentials(credentials);
        const subDomain = toRelativeEmptyRoot(input);

        await ovhRequest(ovhCredentials, 'PUT', zonePath(input.zoneId, `/record/${encodeURIComponent(recordId)}`), {
            subDomain,
            target: input.content,
            ttl: DEFAULT_TTL,
        });

        await refreshZone(ovhCredentials, input.zoneId);

        return {
            id: recordId,
            type: 'A',
            name: subDomain,
            content: input.content,
            ttl: DEFAULT_TTL,
        };
    },

    async deleteRecord(credentials, zoneId, recordId) {
        const ovhCredentials = readOvhCredentials(credentials);

        await ovhRequest(ovhCredentials, 'DELETE', zonePath(zoneId, `/record/${encodeURIComponent(recordId)}`));
        await refreshZone(ovhCredentials, zoneId);
    },
};
