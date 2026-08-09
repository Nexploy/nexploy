import { decrypt, encrypt } from '@/lib/encryption';
import type { DnsCredentialValues } from '@workspace/typescript-interface/dns/dns';

export function encryptDnsCredentials(values: DnsCredentialValues): string {
    return encrypt(JSON.stringify(values));
}

export function decryptDnsCredentials(stored: string): DnsCredentialValues {
    const plain = decrypt(stored);

    try {
        const parsed = JSON.parse(plain);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as DnsCredentialValues;
        }
    } catch {
        /* legacy rows hold a bare Cloudflare API token */
    }

    return { apiToken: plain };
}
