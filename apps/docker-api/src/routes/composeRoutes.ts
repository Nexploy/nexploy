import { Hono } from 'hono';
import { handleAsync } from '@/helpers/handleAsync';
import { zValidator } from '@hono/zod-validator';
import { composeProjectParamSchema } from '@workspace/schemas-zod/docker/composes/composesAction.schema';
import { getValidatedParam } from '@/helpers/validation';
import { docker } from '@/utils/dockerClient';
import { controlComposeStack } from '@/services/composeService';

const app = new Hono();

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
