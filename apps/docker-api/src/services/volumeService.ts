import { docker } from '@/utils/dockerClient';
import { volumesStateManager } from '@/managers/list/volumesStateManager';
import { VolumeDeleteResponse, VolumeDeleteResult } from '@workspace/typescript-interface/docker/docker.volume';

export async function deleteVolumes(
    volumeNames: string[],
    force: boolean,
): Promise<VolumeDeleteResponse> {
    const results = await Promise.all(
        volumeNames.map(async (volumeName): Promise<VolumeDeleteResult> => {
            const volume = volumesStateManager.getState(volumeName);
            if (!volume) {
                return { type: 'skipped', name: volumeName, reason: 'not_found' };
            }

            if (!force && (volume.usageData?.RefCount || 0) > 0) {
                return { type: 'skipped', name: volumeName, reason: 'in_use' };
            }

            await docker.getVolume(volumeName).remove({ force });
            return { type: 'deleted', name: volumeName };
        }),
    );

    const deleted = [];
    const skipped = [];
    for (const result of results) {
        if (result.type === 'deleted') {
            deleted.push(result.name);
        } else if (result.type === 'skipped') {
            skipped.push({ name: result.name, reason: result.reason });
        }
    }

    return { deleted, skipped };
}
