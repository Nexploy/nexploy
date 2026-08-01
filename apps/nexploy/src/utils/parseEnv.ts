export interface EnvVariable {
    key: string;
    value: string;
}

export type EnvSkipReason = 'invalidKey' | 'emptyValue' | 'valueTooLong';

export interface EnvSkippedEntry {
    key: string;
    reason: EnvSkipReason;
}

export interface EnvValidationResult {
    variables: EnvVariable[];
    skipped: EnvSkippedEntry[];
    duplicateKeys: string[];
}

export const ENV_FILE_MAX_SIZE = 1024 * 1024;
export const ENV_KEY_MAX_LENGTH = 256;
export const ENV_VALUE_MAX_LENGTH = 32768;

const ENV_FILE_NAME_PATTERN = /^\.env(\.[A-Za-z0-9_-]+)*$/;
const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Parse the content of a .env-style file into a list of key/value pairs.
 * Ignores empty lines and comments, and strips surrounding quotes from values.
 */
export function parseEnv(content: string): EnvVariable[] {
    return content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .reduce<EnvVariable[]>((acc, line) => {
            const eqIndex = line.indexOf('=');
            if (eqIndex === -1) return acc;
            const key = line.substring(0, eqIndex).trim();
            let value = line.substring(eqIndex + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            if (key) acc.push({ key, value });
            return acc;
        }, []);
}

export function isEnvFileName(fileName: string): boolean {
    return ENV_FILE_NAME_PATTERN.test(fileName.trim());
}

export function isBinaryContent(content: string): boolean {
    return /[\u0000\uFFFD]/.test(content);
}

export function validateEnvVariables(entries: EnvVariable[]): EnvValidationResult {
    const skipped: EnvSkippedEntry[] = [];
    const duplicateKeys: string[] = [];
    const byKey = new Map<string, string>();

    for (const entry of entries) {
        const key = entry.key.replace(/^export\s+/, '').trim();

        if (!ENV_KEY_PATTERN.test(key) || key.length > ENV_KEY_MAX_LENGTH) {
            skipped.push({ key: entry.key, reason: 'invalidKey' });
            continue;
        }
        if (!entry.value) {
            skipped.push({ key, reason: 'emptyValue' });
            continue;
        }
        if (entry.value.length > ENV_VALUE_MAX_LENGTH) {
            skipped.push({ key, reason: 'valueTooLong' });
            continue;
        }
        if (byKey.has(key)) duplicateKeys.push(key);
        byKey.set(key, entry.value);
    }

    return {
        variables: Array.from(byKey, ([key, value]) => ({ key, value })),
        skipped,
        duplicateKeys,
    };
}
