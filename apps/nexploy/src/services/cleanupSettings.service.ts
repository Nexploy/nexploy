import { prisma } from '../../prisma/prisma';
import { cookies } from 'next/headers';
import type { UpdateCleanupSettings } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';

export const LOCAL_ENVIRONMENT_KEY = 'default';

export async function getCurrentEnvironmentKey(): Promise<string> {
    try {
        const cookieStore = await cookies();
        return cookieStore.get('X-Docker-Environment')?.value ?? LOCAL_ENVIRONMENT_KEY;
    } catch {
        return LOCAL_ENVIRONMENT_KEY;
    }
}

export async function getCleanupSettings(environmentId: string = LOCAL_ENVIRONMENT_KEY) {
    try {
        return await prisma.cleanupSettings.upsert({
            where: { environmentId },
            create: { environmentId },
            update: {},
        });
    } catch (error: unknown) {
        throw new Error('Failed to get cleanup settings');
    }
}

export async function updateCleanupSettings(
    data: UpdateCleanupSettings,
    environmentId: string = LOCAL_ENVIRONMENT_KEY,
) {
    try {
        return await prisma.cleanupSettings.upsert({
            where: { environmentId },
            create: { environmentId, ...data },
            update: data,
        });
    } catch (error: unknown) {
        throw new Error('Failed to update cleanup settings');
    }
}

export async function markCleanupRan(
    reclaimed: number,
    environmentId: string = LOCAL_ENVIRONMENT_KEY,
) {
    try {
        return await prisma.cleanupSettings.update({
            where: { environmentId },
            data: { lastRunAt: new Date(), lastReclaimed: reclaimed },
        });
    } catch (error: unknown) {
        throw new Error('Failed to mark cleanup as ran');
    }
}
