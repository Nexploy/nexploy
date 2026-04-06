import { docker } from '@/utils/dockerClient';

const BUILTIN_NETWORKS = new Set(['bridge', 'host', 'none']);

export async function deleteNetworks(
    networkIds: string[],
    force: boolean,
): Promise<{ deleted: string[]; skipped: { id: string; name: string; reason?: string }[] }> {
    const results = await Promise.all(
        networkIds.map(async (networkId) => {
            const network = docker.getNetwork(networkId);
            const info = await network.inspect();

            if (BUILTIN_NETWORKS.has(info.Name)) {
                return { type: 'skipped', id: networkId, name: info.Name, reason: 'builtin' };
            }

            if (!force) {
                if (info.Labels?.['com.docker.compose.project']) {
                    return {
                        type: 'skipped',
                        id: networkId,
                        name: info.Name,
                        reason: 'compose_stack',
                    };
                }

                if (Object.keys(info.Containers || {}).length > 0) {
                    return {
                        type: 'skipped',
                        id: networkId,
                        name: info.Name,
                        reason: 'has_containers',
                    };
                }
            } else {
                await Promise.all(
                    Object.keys(info.Containers || {}).map((containerId) =>
                        network.disconnect({ Container: containerId, Force: true }),
                    ),
                );
            }

            await network.remove();
            return { type: 'deleted', id: networkId, name: info.Name };
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
