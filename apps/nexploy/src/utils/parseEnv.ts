export interface EnvVariable {
    key: string;
    value: string;
}

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
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            if (key) acc.push({ key, value });
            return acc;
        }, []);
}
