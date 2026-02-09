import { Hono } from 'hono';
import { handleAsync } from '@/helpers/handleAsync';
import { logger } from '@/utils/logger';
import { ComposesAction } from '@workspace/typescript-interface/docker/docker.composeStack';
import { docker } from '@/utils/dockerClient';

const app = new Hono();

async function controlComposeStack(projectName: string, action: ComposesAction) {
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

app.get(
    '/:project/list',
    handleAsync(async (c) => {
        const projectName = c.req.param('project');

        return await docker.listContainers({
            filters: {
                label: [`com.docker.compose.project=${projectName}`],
            },
        });
    }),
);

app.post(
    '/:project/start',
    handleAsync(async (c) => {
        const project = c.req.param('project');
        return controlComposeStack(project, 'start');
    }),
);

app.post(
    '/:project/stop',
    handleAsync(async (c) => {
        const project = c.req.param('project');
        return controlComposeStack(project, 'stop');
    }),
);

app.post(
    '/:project/pause',
    handleAsync(async (c) => {
        const project = c.req.param('project');
        return controlComposeStack(project, 'pause');
    }),
);

app.post(
    '/:project/unpause',
    handleAsync(async (c) => {
        const project = c.req.param('project');
        return controlComposeStack(project, 'unpause');
    }),
);

app.post(
    '/:project/restart',
    handleAsync(async (c) => {
        const project = c.req.param('project');
        return controlComposeStack(project, 'restart');
    }),
);

app.post(
    '/:project/remove',
    handleAsync(async (c) => {
        const project = c.req.param('project');
        return controlComposeStack(project, 'remove');
    }),
);

app.get(
    '/:project',
    handleAsync(async (c) => {
        const project = c.req.param('project');
        const containers = await docker.listContainers({ all: true });
        const composeContainers = containers.filter(
            (c) => c.Labels['com.docker.compose.project'] === project,
        );
        return composeContainers.map((c) => ({
            id: c.Id,
            name: c.Names[0],
            image: c.Image,
            state: c.State,
            status: c.Status,
        }));
    }),
);

export default app;
