import { createHash } from 'crypto';
import type { DnsCredentialValues } from '@workspace/typescript-interface/dns/dns';

const DEFAULT_ENDPOINT = 'https://eu.api.ovh.com/1.0';

const clockDeltaByEndpoint = new Map<string, number>();

export interface OvhCredentials {
    applicationKey: string;
    applicationSecret: string;
    consumerKey: string;
    endpoint: string;
}

export function readOvhCredentials(credentials: DnsCredentialValues): OvhCredentials {
    const { applicationKey, applicationSecret, consumerKey } = credentials;
    if (!(applicationKey && applicationSecret && consumerKey)) {
        throw new Error('Missing OVHcloud API credentials');
    }
    return {
        applicationKey,
        applicationSecret,
        consumerKey,
        endpoint: (credentials.endpoint?.trim() || DEFAULT_ENDPOINT).replace(/\/+$/, ''),
    };
}

async function serverTimestamp(endpoint: string): Promise<number> {
    let delta = clockDeltaByEndpoint.get(endpoint);

    if (delta === undefined) {
        const response = await fetch(`${endpoint}/auth/time`);
        const serverTime = Number(await response.text());
        delta = Number.isFinite(serverTime) ? serverTime - Math.floor(Date.now() / 1000) : 0;
        clockDeltaByEndpoint.set(endpoint, delta);
    }

    return Math.floor(Date.now() / 1000) + delta;
}

function sign(credentials: OvhCredentials, method: string, url: string, body: string, timestamp: number): string {
    const payload = [credentials.applicationSecret, credentials.consumerKey, method, url, body, String(timestamp)].join(
        '+',
    );

    return `$1$${createHash('sha1').update(payload).digest('hex')}`;
}

export async function ovhRequest<T>(
    credentials: OvhCredentials,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
): Promise<T> {
    const url = `${credentials.endpoint}${path}`;
    const serializedBody = body === undefined ? '' : JSON.stringify(body);
    const timestamp = await serverTimestamp(credentials.endpoint);

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Ovh-Application': credentials.applicationKey,
            'X-Ovh-Consumer': credentials.consumerKey,
            'X-Ovh-Timestamp': String(timestamp),
            'X-Ovh-Signature': sign(credentials, method, url, serializedBody, timestamp),
        },
        body: serializedBody === '' ? undefined : serializedBody,
    });

    if (!response.ok) {
        throw new Error(`OVHcloud API error ${response.status}: ${await response.text()}`);
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
}
