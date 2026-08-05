import { docker } from '@/utils/dockerClient';
import { ComposesAction } from '@workspace/typescript-interface/docker/docker.composeStack';
import { containersStateManager } from '@/managers/list/containersStateManager';

export async function controlComposeStack(
    projectName: string,
    action: ComposesAction,
    force = false,
    onProgress?: (progress: number) => void,
) {
    const composeContainers = containersStateManager
        .getAllStates()
        .filter((c) => c.labels['com.docker.compose.project'] === projectName);

    let completed = 0;

    const actions = composeContainers.map(async (containerInfo) => {
        const container = docker.getContainer(containerInfo.id);

        if (action === 'start') await container.start();
        if (action === 'stop') await container.stop();
        if (action === 'pause') await container.pause();
        if (action === 'unpause') await container.unpause();
        if (action === 'restart') await container.restart();
        if (action === 'remove') {
            if (!force && containerInfo.state === 'running') await container.stop();
            await container.remove({ force });
        }

        completed += 1;
        onProgress?.((completed / composeContainers.length) * 100);

        return {
            id: containerInfo.id,
            name: containerInfo.name,
            state: containerInfo.state,
            status: containerInfo.status,
        };
    });

    return await Promise.all(actions);
}
