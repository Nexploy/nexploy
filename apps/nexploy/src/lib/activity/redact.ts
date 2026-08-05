const REDACTED = '[redacted]';

const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 25;
const MAX_STRING_LENGTH = 512;
const MAX_SERIALIZED_LENGTH = 8_000;

const SENSITIVE_KEYS = new Set([
    'apikey',
    'accesstoken',
    'auth',
    'authorization',
    'backupcodes',
    'clientsecret',
    'code',
    'credentials',
    'idtoken',
    'passphrase',
    'password',
    'privatekey',
    'refreshtoken',
    'secret',
    'sshkey',
    'tlsca',
    'tlscert',
    'tlskey',
    'token',
    'totp',
    'value',
    'webhooksecret',
]);

function isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEYS.has(key.toLowerCase());
}

function truncate(value: string): string {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
}

function sanitize(value: unknown, depth: number): unknown {
    if (value === null || value === undefined) return value;

    if (typeof value === 'string') return truncate(value);

    if (typeof value === 'number' || typeof value === 'boolean') return value;

    if (value instanceof Date) return value.toISOString();

    if (depth >= MAX_DEPTH) return REDACTED;

    if (Array.isArray(value)) {
        const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitize(item, depth + 1));

        return value.length > MAX_ARRAY_ITEMS ? [...items, `… +${value.length - MAX_ARRAY_ITEMS}`] : items;
    }

    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
                key,
                isSensitiveKey(key) ? REDACTED : sanitize(entry, depth + 1),
            ]),
        );
    }

    return REDACTED;
}

export function redactMetadata(input: unknown): unknown {
    if (input === null || input === undefined) return undefined;

    const sanitized = sanitize(input, 0);
    const serialized = JSON.stringify(sanitized);

    if (serialized && serialized.length > MAX_SERIALIZED_LENGTH) {
        return { truncated: true, preview: `${serialized.slice(0, MAX_SERIALIZED_LENGTH)}…` };
    }

    return sanitized;
}
