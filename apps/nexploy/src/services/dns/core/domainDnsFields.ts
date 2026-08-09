interface DomainDnsFields {
    dnsCredentialId?: string;
    dnsZoneId?: string;
    dnsZoneName?: string;
    dnsRecordId?: string;
    cloudflareCredentialId?: string;
    cloudflareZoneId?: string;
    cloudflareZoneName?: string;
    cloudflareDnsRecordId?: string;
}

export function normalizeDomainDnsFields<T extends DomainDnsFields>(domain: T): T {
    const { cloudflareCredentialId, cloudflareZoneId, cloudflareZoneName, cloudflareDnsRecordId, ...rest } = domain;

    return {
        ...rest,
        dnsCredentialId: domain.dnsCredentialId ?? cloudflareCredentialId,
        dnsZoneId: domain.dnsZoneId ?? cloudflareZoneId,
        dnsZoneName: domain.dnsZoneName ?? cloudflareZoneName,
        dnsRecordId: domain.dnsRecordId ?? cloudflareDnsRecordId,
    } as T;
}
