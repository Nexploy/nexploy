import { statfs } from 'fs/promises';
import { logger } from '@/utils/logger';
import { DISK_GUARD_PATH } from '@/lib/config';
import type {
    DiskGuardLevel,
    DiskGuardSettings,
    HostDiskUsage,
} from '@workspace/typescript-interface/docker/docker.disk';

const FALLBACK_PATH = '/';

async function readPath(path: string): Promise<HostDiskUsage> {
    const stats = await statfs(path);

    const blockSize = Number(stats.bsize);
    const totalBytes = Number(stats.blocks) * blockSize;
    const availableBytes = Number(stats.bavail) * blockSize;
    const usedBytes = (Number(stats.blocks) - Number(stats.bfree)) * blockSize;
    const denominator = usedBytes + availableBytes;

    return {
        path,
        totalBytes,
        freeBytes: availableBytes,
        usedBytes,
        usedPercent: denominator > 0 ? Math.round((usedBytes / denominator) * 10000) / 100 : 0,
    };
}

export async function readHostDiskUsage(): Promise<HostDiskUsage> {
    try {
        return await readPath(DISK_GUARD_PATH);
    } catch (error) {
        logger.warn({ error, path: DISK_GUARD_PATH }, 'Failed to read disk usage on the configured path');
        return readPath(FALLBACK_PATH);
    }
}

export function resolveDiskGuardLevel(usage: HostDiskUsage, settings: DiskGuardSettings): DiskGuardLevel {
    const freeMb = usage.freeBytes / 1024 / 1024;

    if (usage.usedPercent >= settings.blockPercent || freeMb < settings.minFreeMb) return 'block';
    if (usage.usedPercent >= settings.warnPercent) return 'warn';

    return 'ok';
}
