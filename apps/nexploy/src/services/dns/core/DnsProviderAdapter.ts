import { DnsProviderType } from 'generated/client';
import type {
    DnsCredentialValues,
    DnsProviderCapabilities,
    DnsRecord,
    DnsRecordInput,
    DnsZone,
} from '@workspace/typescript-interface/dns/dns';

export interface DnsProviderAdapter {
    readonly type: DnsProviderType;
    readonly capabilities: DnsProviderCapabilities;
    verifyCredentials(credentials: DnsCredentialValues): Promise<void>;
    listZones(credentials: DnsCredentialValues): Promise<DnsZone[]>;
    createRecord(credentials: DnsCredentialValues, input: DnsRecordInput): Promise<DnsRecord>;
    updateRecord(credentials: DnsCredentialValues, recordId: string, input: DnsRecordInput): Promise<DnsRecord>;
    deleteRecord(credentials: DnsCredentialValues, zoneId: string, recordId: string): Promise<void>;
}
