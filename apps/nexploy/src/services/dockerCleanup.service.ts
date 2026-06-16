import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';
import type { CleanupTarget } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';
import type { CleanupResult } from '@workspace/typescript-interface/docker/docker.system';

export async function runCleanupTarget(
    target: CleanupTarget,
    environmentId?: string,
): Promise<number> {
    const result = await kyDocker
        .post(`system/prune/${target}`, { environmentId } as KyDockerOptions)
        .json<CleanupResult>();

    return result.reclaimedSpace ?? 0;
}

export async function runScheduledCleanup(targets: CleanupTarget[]): Promise<number> {
    let reclaimed = 0;
    for (const target of targets) {
        reclaimed += await runCleanupTarget(target);
    }
    return reclaimed;
}
