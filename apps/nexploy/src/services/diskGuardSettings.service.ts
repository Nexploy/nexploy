import { prisma } from '../../prisma/prisma';
import type { UpdateDiskGuardSettings } from '@workspace/schemas-zod/docker/system/diskGuard.schema';
import { getErrorTranslator } from '@/lib/i18n/serverErrors';

export const DISK_GUARD_SETTINGS_KEY = 'default';

export async function getDiskGuardSettings() {
    const t = await getErrorTranslator();
    try {
        return await prisma.diskGuardSettings.upsert({
            where: { environmentId: DISK_GUARD_SETTINGS_KEY },
            create: { environmentId: DISK_GUARD_SETTINGS_KEY },
            update: {},
        });
    } catch (error: unknown) {
        throw new Error(t('diskGuard.getFailed'), { cause: error });
    }
}

export async function updateDiskGuardSettings(data: UpdateDiskGuardSettings) {
    const t = await getErrorTranslator();
    try {
        return await prisma.diskGuardSettings.upsert({
            where: { environmentId: DISK_GUARD_SETTINGS_KEY },
            create: { environmentId: DISK_GUARD_SETTINGS_KEY, ...data },
            update: data,
        });
    } catch (error: unknown) {
        throw new Error(t('diskGuard.updateFailed'), { cause: error });
    }
}

export async function markDiskAlertRaised(level: 'warn' | 'block') {
    return prisma.diskGuardSettings.update({
        where: { environmentId: DISK_GUARD_SETTINGS_KEY },
        data: { lastAlertAt: new Date(), lastAlertLevel: level },
    });
}

export async function clearDiskAlert() {
    return prisma.diskGuardSettings.update({
        where: { environmentId: DISK_GUARD_SETTINGS_KEY },
        data: { lastAlertLevel: null },
    });
}
