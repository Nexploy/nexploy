import { logger } from '@/utils/logger';
import { kyNexploy } from '@/lib/kyNexploy';
import type { DiskGuardSettings } from '@workspace/typescript-interface/docker/docker.disk';

const CACHE_TTL_MS = 30_000;

export const DEFAULT_DISK_GUARD_SETTINGS: DiskGuardSettings = {
    enabled: true,
    warnPercent: 80,
    blockPercent: 90,
    minFreeMb: 2048,
};

let cachedSettings: DiskGuardSettings = DEFAULT_DISK_GUARD_SETTINGS;
let cachedAt = 0;

export async function getDiskGuardSettings(): Promise<DiskGuardSettings> {
    if (Date.now() - cachedAt < CACHE_TTL_MS) return cachedSettings;

    try {
        cachedSettings = await kyNexploy.get('system/disk-guard').json<DiskGuardSettings>();
    } catch (error) {
        logger.warn({ error }, 'Failed to load disk guard settings from the Nexploy API, using the last known values');
    }

    cachedAt = Date.now();

    return cachedSettings;
}
