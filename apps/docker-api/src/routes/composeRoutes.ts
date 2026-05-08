import { Hono } from 'hono';
import { route } from '@/utils/route';
import { composeProjectParamSchema } from '@workspace/schemas-zod/docker/composes/composesAction.schema';
import { docker } from '@/utils/dockerClient';
import { controlComposeStack } from '@/services/composeService';

const app = new Hono();

app.get(
    '/:project/list',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project: projectName } = c.req.valid('param');

        return await docker.listContainers({
            filters: {
                label: [`com.docker.compose.project=${projectName}`],
            },
        });
    }),
);

app.post(
    '/:project/start',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'start');
    }),
);

app.post(
    '/:project/stop',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'stop');
    }),
);

app.post(
    '/:project/pause',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'pause');
    }),
);

app.post(
    '/:project/unpause',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'unpause');
    }),
);

app.post(
    '/:project/restart',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'restart');
    }),
);

app.post(
    '/:project/remove',
    route({ param: composeProjectParamSchema }, async (c) => {
        const { project } = c.req.valid('param');
        return controlComposeStack(project, 'remove');
    }),
);

export default app;
