import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import { ComposesAction } from '@workspace/typescript-interface/docker/docker.composeStack';
import { containersStateManager } from '@/managers/containersStateManager';

export async function controlComposeStack(projectName: string, action: ComposesAction) {
    const composeContainers = containersStateManager
        .getAllStates()
        .filter((c) => c.labels['com.docker.compose.project'] === projectName);

    const actions = composeContainers.map(async (containerInfo) => {
        const container = docker.getContainer(containerInfo.id);

        try {
            if (action === 'start') await container.start();
            if (action === 'stop') await container.stop();
            if (action === 'pause') await container.pause();
            if (action === 'unpause') await container.unpause();
            if (action === 'restart') await container.restart();
            if (action === 'remove') {
                if (containerInfo.state === 'running') await container.stop();
                await container.remove();
            }
        } catch (error: any) {
            if (error?.message?.includes('already')) {
                logger.debug(`Container ${containerInfo.name}: ${error.message}`);
            } else {
                throw error;
            }
        }

        return {
            id: containerInfo.id,
            name: containerInfo.name,
            state: containerInfo.state,
            status: containerInfo.status,
        };
    });

    return await Promise.all(actions);
}
