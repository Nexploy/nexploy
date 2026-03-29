import { Hono } from 'hono';
import { handleAsync } from '@/helpers/handleAsync';
import { logger } from '@/utils/logger';
import { ComposesAction } from '@workspace/typescript-interface/docker/docker.composeStack';
import { docker } from '@/utils/dockerClient';
import { zValidator } from '@hono/zod-validator';
import { composeProjectParamSchema } from '@workspace/schemas-zod/docker/composes/composesAction.schema';
import { getValidatedParam } from '@/helpers/validation';

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
    zValidator('param', composeProjectParamSchema),
    handleAsync(async (c) => {
        const { project: projectName } = getValidatedParam(c, composeProjectParamSchema);

        return await docker.listContainers({
            filters: {
                label: [`com.docker.compose.project=${projectName}`],
            },
        });
    }),
);

app.post(
    '/:project/start',
    zValidator('param', composeProjectParamSchema),
    handleAsync(async (c) => {
        const { project } = getValidatedParam(c, composeProjectParamSchema);
        return controlComposeStack(project, 'start');
    }),
);

app.post(
    '/:project/stop',
    zValidator('param', composeProjectParamSchema),
    handleAsync(async (c) => {
        const { project } = getValidatedParam(c, composeProjectParamSchema);
        return controlComposeStack(project, 'stop');
    }),
);

app.post(
    '/:project/pause',
    zValidator('param', composeProjectParamSchema),
    handleAsync(async (c) => {
        const { project } = getValidatedParam(c, composeProjectParamSchema);
        return controlComposeStack(project, 'pause');
    }),
);

app.post(
    '/:project/unpause',
    zValidator('param', composeProjectParamSchema),
    handleAsync(async (c) => {
        const { project } = getValidatedParam(c, composeProjectParamSchema);
        return controlComposeStack(project, 'unpause');
    }),
);

app.post(
    '/:project/restart',
    zValidator('param', composeProjectParamSchema),
    handleAsync(async (c) => {
        const { project } = getValidatedParam(c, composeProjectParamSchema);
        return controlComposeStack(project, 'restart');
    }),
);

app.post(
    '/:project/remove',
    zValidator('param', composeProjectParamSchema),
    handleAsync(async (c) => {
        const { project } = getValidatedParam(c, composeProjectParamSchema);
        return controlComposeStack(project, 'remove');
    }),
);

export default app;
