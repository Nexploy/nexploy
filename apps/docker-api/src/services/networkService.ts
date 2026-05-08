import { docker } from '@/utils/dockerClient';
import { networksStateManager } from '@/managers/list/networksStateManager';
import { isBuiltinNetwork } from '@workspace/shared/nexployFilter';

export async function deleteNetworks(
    networkIds: string[],
    force: boolean,
): Promise<{ deleted: string[]; skipped: { id: string; name: string; reason?: string }[] }> {
    const results = await Promise.all(
        networkIds.map(async (networkId) => {
            const info = networksStateManager.getById(networkId);
            if (!info) {
                return { type: 'skipped', id: networkId, name: networkId, reason: 'not_found' };
            }

            if (isBuiltinNetwork(info.name)) {
                return { type: 'skipped', id: networkId, name: info.name, reason: 'builtin' };
            }

            const network = docker.getNetwork(networkId);

            if (!force) {
                if (info.labels?.['com.docker.compose.project']) {
                    return {
                        type: 'skipped',
                        id: networkId,
                        name: info.name,
                        reason: 'compose_stack',
                    };
                }

                if (info.containers.length > 0) {
                    return {
                        type: 'skipped',
                        id: networkId,
                        name: info.name,
                        reason: 'has_containers',
                    };
                }
            } else {
                await Promise.all(
                    info.containers.map((containerId) =>
                        network.disconnect({ Container: containerId, Force: true }),
                    ),
                );
            }

            await network.remove();
            return { type: 'deleted', id: networkId, name: info.name };
        }),
    );

    const deleted: string[] = [];
    const skipped: { id: string; name: string; reason?: string }[] = [];
    for (const result of results) {
        if (result.type === 'deleted') {
            deleted.push(result.id);
        } else {
            skipped.push({ id: result.id, name: result.name, reason: result.reason });
        }
    }

    return { deleted, skipped };
}
