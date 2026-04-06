import { docker } from '@/utils/dockerClient';
import { logger } from '@/utils/logger';
import { ComposesAction } from '@workspace/typescript-interface/docker/docker.composeStack';

export async function controlComposeStack(projectName: string, action: ComposesAction) {
    const containers = await docker.listContainers({ all: true });
    const composeContainers = containers.filter(
        (c) => c.Labels['com.docker.compose.project'] === projectName,
    );

    const actions = composeContainers.map(async (containerInfo) => {
        const container = docker.getContainer(containerInfo.Id);

        try {
            if (action === 'start') await container.start();
            if (action === 'stop') await container.stop();
            if (action === 'pause') await container.pause();
            if (action === 'unpause') await container.unpause();
            if (action === 'restart') await container.restart();
            if (action === 'remove') {
                if (containerInfo.State === 'running') await container.stop();
                await container.remove();
            }
        } catch (error: any) {
            if (error?.message?.includes('already')) {
                logger.debug(`Container ${containerInfo.Names[0]}: ${error.message}`);
            } else {
                throw error;
            }
        }

        return {
            id: containerInfo.Id,
            name: containerInfo.Names[0],
            state: containerInfo.State,
            status: containerInfo.Status,
        };
    });

    return await Promise.all(actions);
}
