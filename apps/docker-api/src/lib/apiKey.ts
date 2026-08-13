import ky from 'ky';
import { logger } from '@/utils/logger';

let cachedKey: string | null = null;
let inflight: Promise<string | null> | null = null;

async function fetchNexployApiKey(): Promise<string | null> {
    const baseUrl = process.env.NEXPLOY_API_URL;
    const internalSecret = process.env.ENCRYPTION_KEY;

    if (!baseUrl || !internalSecret) {
        logger.warn('Cannot fetch the Nexploy API key: NEXPLOY_API_URL or ENCRYPTION_KEY is not set');
        return null;
    }

    try {
        const { key } = await ky
            .get(`${baseUrl}/api/internal/docker-api-key`, {
                headers: { 'x-internal-secret': internalSecret },
                timeout: 10_000,
                retry: 0,
            })
            .json<{ key?: string }>();

        if (!key) return null;

        cachedKey = key;
        logger.info('Nexploy API key retrieved');

        return key;
    } catch (error) {
        logger.warn({ error }, 'Failed to retrieve the Nexploy API key (nexploy may still be starting up)');
        return null;
    }
}

export async function getNexployApiKey(): Promise<string | null> {
    const fromEnv = process.env.NEXPLOY_API_KEY;
    if (fromEnv) return fromEnv;

    if (cachedKey) return cachedKey;
    if (inflight) return inflight;

    inflight = fetchNexployApiKey().finally(() => {
        inflight = null;
    });

    return inflight;
}

export function clearCachedNexployApiKey(): void {
    cachedKey = null;
}
