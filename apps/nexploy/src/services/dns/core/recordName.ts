import type { DnsRecordInput } from '@workspace/typescript-interface/dns/dns';

const ROOT = '@';

export function toFqdn(input: DnsRecordInput): string {
    return input.subdomain === ROOT ? input.zoneName : `${input.subdomain}.${input.zoneName}`;
}

export function toDottedFqdn(input: DnsRecordInput): string {
    return `${toFqdn(input)}.`;
}

export function toRelativeAtRoot(input: DnsRecordInput): string {
    return input.subdomain === ROOT ? ROOT : input.subdomain;
}

export function toRelativeEmptyRoot(input: DnsRecordInput): string {
    return input.subdomain === ROOT ? '' : input.subdomain;
}

export function stripTrailingDot(value: string): string {
    return value.endsWith('.') ? value.slice(0, -1) : value;
}
