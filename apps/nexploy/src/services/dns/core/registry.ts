import { DnsProviderType } from 'generated/client';
import { DnsProviderAdapter } from '@/services/dns/core/DnsProviderAdapter';
import { cloudflareDnsAdapter } from '@/services/dns/providers/cloudflare/cloudflare.adapter';
import { hetznerDnsAdapter } from '@/services/dns/providers/hetzner/hetzner.adapter';
import { digitalOceanDnsAdapter } from '@/services/dns/providers/digitalocean/digitalocean.adapter';
import { vultrDnsAdapter } from '@/services/dns/providers/vultr/vultr.adapter';
import { linodeDnsAdapter } from '@/services/dns/providers/linode/linode.adapter';
import { porkbunDnsAdapter } from '@/services/dns/providers/porkbun/porkbun.adapter';
import { powerDnsAdapter } from '@/services/dns/providers/powerdns/powerdns.adapter';
import { ovhDnsAdapter } from '@/services/dns/providers/ovh/ovh.adapter';

const dnsAdapters: Record<DnsProviderType, DnsProviderAdapter> = {
    CLOUDFLARE: cloudflareDnsAdapter,
    HETZNER: hetznerDnsAdapter,
    DIGITALOCEAN: digitalOceanDnsAdapter,
    VULTR: vultrDnsAdapter,
    LINODE: linodeDnsAdapter,
    PORKBUN: porkbunDnsAdapter,
    POWERDNS: powerDnsAdapter,
    OVH: ovhDnsAdapter,
};

export function getDnsAdapter(provider: DnsProviderType): DnsProviderAdapter {
    const adapter = dnsAdapters[provider];
    if (!adapter) {
        throw new Error(`Unsupported DNS provider: ${provider}`);
    }
    return adapter;
}

export function isSupportedDnsProvider(provider: string): provider is DnsProviderType {
    return provider in dnsAdapters;
}
