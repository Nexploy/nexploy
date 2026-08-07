import { cookies } from 'next/headers';
import { prisma } from '../../../prisma/prisma';
import { getDefaultEnvironment } from '@/services/environment/environment.service';
import { ENVIRONMENT_COOKIE_NAME } from '@/lib/api/environmentCookie';

export { ENVIRONMENT_COOKIE_NAME };

export async function getCurrentEnvironmentId(): Promise<string | undefined> {
    try {
        const cookieStore = await cookies();
        const environmentId = cookieStore.get(ENVIRONMENT_COOKIE_NAME)?.value;
        if (environmentId) return environmentId;
    } catch {
        /* empty */
    }

    const defaultEnvironment = await getDefaultEnvironment().catch(() => null);
    return defaultEnvironment?.id;
}

export async function getEnvironmentIdForStage(stageId?: string): Promise<string | undefined> {
    if (stageId) {
        const stage = await prisma.deploymentStage
            .findUnique({ where: { id: stageId }, select: { environmentId: true } })
            .catch(() => null);

        if (stage?.environmentId) return stage.environmentId;
    }

    return getCurrentEnvironmentId();
}
