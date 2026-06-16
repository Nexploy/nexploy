import { prisma } from '../../prisma/prisma';
import type { UpdateCleanupSettings } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';

export async function getCleanupSettings() {
    try {
        return await prisma.cleanupSettings.upsert({
            where: { id: 'singleton' },
            create: { id: 'singleton' },
            update: {},
        });
    } catch (error: unknown) {
        throw new Error('Failed to get cleanup settings');
    }
}

export async function updateCleanupSettings(data: UpdateCleanupSettings) {
    try {
        return await prisma.cleanupSettings.upsert({
            where: { id: 'singleton' },
            create: { id: 'singleton', ...data },
            update: data,
        });
    } catch (error: unknown) {
        throw new Error('Failed to update cleanup settings');
    }
}

export async function markCleanupRan(reclaimed: number) {
    try {
        return await prisma.cleanupSettings.update({
            where: { id: 'singleton' },
            data: { lastRunAt: new Date(), lastReclaimed: reclaimed },
        });
    } catch (error: unknown) {
        throw new Error('Failed to mark cleanup as ran');
    }
}
