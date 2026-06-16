import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import type { CleanupTarget } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';
import type { CleanupResult } from '@workspace/typescript-interface/docker/docker.system';
import { LOCAL_ENVIRONMENT_KEY } from '@/services/cleanupSettings.service';

export async function runCleanupTarget(
    target: CleanupTarget,
    environmentId?: string,
): Promise<number> {
    const result = await kyDocker
        .post(`system/prune/${target}`, { environmentId } as KyDockerOptions)
        .json<CleanupResult>();

    return result.reclaimedSpace ?? 0;
}

export async function runScheduledCleanup(
    targets: CleanupTarget[],
    environmentId?: string,
): Promise<number> {
    const targetEnvironment =
        environmentId && environmentId !== LOCAL_ENVIRONMENT_KEY ? environmentId : undefined;

    let reclaimed = 0;
    for (const target of targets) {
        reclaimed += await runCleanupTarget(target, targetEnvironment);
    }
    return reclaimed;
}
