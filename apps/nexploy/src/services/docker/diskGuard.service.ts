import { kyDocker } from '@/lib/api/kyDocker';
import { getDiskGuardSettings } from '@/services/diskGuardSettings.service';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';
import type {
    DiskGuardLevel,
    DiskGuardSettings,
    DiskGuardStatus,
    HostDiskUsage,
} from '@workspace/typescript-interface/docker/docker.disk';

export function resolveDiskGuardLevel(usage: HostDiskUsage, settings: DiskGuardSettings): DiskGuardLevel {
    const freeMb = usage.freeBytes / 1024 / 1024;

    if (usage.usedPercent >= settings.blockPercent || freeMb < settings.minFreeMb) return 'block';
    if (usage.usedPercent >= settings.warnPercent) return 'warn';

    return 'ok';
}

export async function getDiskGuardStatus(): Promise<DiskGuardStatus | null> {
    try {
        return await kyDocker.get('system/disk').json<DiskGuardStatus>();
    } catch {
        return null;
    }
}

export async function assertDiskSpaceAvailable(): Promise<void> {
    const settings = await getDiskGuardSettings();

    if (!settings.enabled) return;

    let usage: HostDiskUsage;
    try {
        usage = await kyDocker.get('system/disk').json<HostDiskUsage>();
    } catch {
        return;
    }

    if (resolveDiskGuardLevel(usage, settings) !== 'block') return;

    const t = await getErrorTranslator();

    throw new Error(
        t('diskGuard.blocked', {
            usedPercent: usage.usedPercent,
            freeMb: Math.round(usage.freeBytes / 1024 / 1024),
        }),
    );
}
