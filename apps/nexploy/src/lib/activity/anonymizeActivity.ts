import crypto from 'node:crypto';
import type { ActivityLogEntry } from '@workspace/typescript-interface/activity';

const PSEUDONYM_PREFIX = 'anon_';
const PSEUDONYM_LENGTH = 16;

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const IPV4_PATTERN = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
const IPV6_PATTERN = /\b(?:[a-f\d]{1,4}:){3,7}[a-f\d]{1,4}\b|::[a-f\d]{1,4}\b/gi;
const JWT_PATTERN = /\beyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const BEARER_PATTERN = /\b(bearer|token|apikey|api_key)[=:\s]+\S+/gi;
const URL_CREDENTIALS_PATTERN = /\b([a-z][\w+.-]*:\/\/)[^/\s:@]+:[^/\s:@]+@/gi;

const REDACTED_EMAIL = '[email]';
const REDACTED_IP = '[ip]';
const REDACTED_SECRET = '[secret]';

const BROWSER_FAMILIES: [RegExp, string][] = [
    [/edg[ea]?\//i, 'Edge'],
    [/opr\/|opera/i, 'Opera'],
    [/chrome\/|crios\//i, 'Chrome'],
    [/firefox\/|fxios\//i, 'Firefox'],
    [/safari\//i, 'Safari'],
    [/curl\//i, 'curl'],
    [/wget\//i, 'Wget'],
    [/postman/i, 'Postman'],
    [/node|axios|got|ky|undici/i, 'HTTP client'],
    [/bot|crawler|spider/i, 'Bot'],
];

const OS_FAMILIES: [RegExp, string][] = [
    [/windows/i, 'Windows'],
    [/mac os x|macintosh/i, 'macOS'],
    [/android/i, 'Android'],
    [/iphone|ipad|ios/i, 'iOS'],
    [/linux/i, 'Linux'],
];

let fallbackSalt: string | null = null;

function pseudonymSecret(): string {
    const key = process.env.ENCRYPTION_KEY;

    if (key) return key;

    fallbackSalt ??= crypto.randomBytes(32).toString('hex');

    return fallbackSalt;
}

export function pseudonymize(value: string | null): string | null {
    if (!value) return null;

    const digest = crypto.createHmac('sha256', pseudonymSecret()).update(value).digest('hex');

    return `${PSEUDONYM_PREFIX}${digest.slice(0, PSEUDONYM_LENGTH)}`;
}

export function maskEmail(email: string | null): string | null {
    if (!email) return null;

    const [local, domain] = email.split('@');

    if (!local || !domain) return REDACTED_EMAIL;

    return `${local.slice(0, 1)}***@${domain}`;
}

export function maskName(name: string | null): string | null {
    if (!name) return null;

    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => `${part.slice(0, 1).toUpperCase()}.`)
        .join(' ');

    return initials || null;
}

export function maskIpAddress(ipAddress: string | null): string | null {
    if (!ipAddress) return null;

    if (ipAddress.includes(':')) {
        const groups = ipAddress.split(':').filter(Boolean).slice(0, 3);

        return groups.length > 0 ? `${groups.join(':')}::/48` : REDACTED_IP;
    }

    const octets = ipAddress.split('.');

    if (octets.length !== 4) return REDACTED_IP;

    return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
}

export function maskUserAgent(userAgent: string | null): string | null {
    if (!userAgent) return null;

    const browser = BROWSER_FAMILIES.find(([pattern]) => pattern.test(userAgent))?.[1];
    const os = OS_FAMILIES.find(([pattern]) => pattern.test(userAgent))?.[1];

    if (!browser && !os) return 'Unknown';

    return [browser, os].filter(Boolean).join(' — ');
}

export function scrubText(value: string): string {
    return value
        .replace(URL_CREDENTIALS_PATTERN, `$1${REDACTED_SECRET}@`)
        .replace(JWT_PATTERN, REDACTED_SECRET)
        .replace(BEARER_PATTERN, `$1 ${REDACTED_SECRET}`)
        .replace(EMAIL_PATTERN, REDACTED_EMAIL)
        .replace(IPV4_PATTERN, REDACTED_IP)
        .replace(IPV6_PATTERN, REDACTED_IP);
}

function scrubValue(value: unknown): unknown {
    if (typeof value === 'string') return scrubText(value);

    if (Array.isArray(value)) return value.map(scrubValue);

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, scrubValue(entry)]),
        );
    }

    return value;
}

export function anonymizeActivityEntry(entry: ActivityLogEntry): ActivityLogEntry {
    return {
        ...entry,
        actorId: pseudonymize(entry.actorId),
        actorEmail: maskEmail(entry.actorEmail),
        actorName: maskName(entry.actorName),
        ipAddress: maskIpAddress(entry.ipAddress),
        userAgent: maskUserAgent(entry.userAgent),
        targetName: entry.targetName ? scrubText(entry.targetName) : entry.targetName,
        errorMessage: entry.errorMessage ? scrubText(entry.errorMessage) : entry.errorMessage,
        metadata: scrubValue(entry.metadata),
    };
}
