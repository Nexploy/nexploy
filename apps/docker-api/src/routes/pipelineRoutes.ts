import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { handleAsync } from '@/helpers/handleAsync';
import { DeployOptions } from '@workspace/typescript-interface/inngest/deploy';

const app = new Hono();

app.post(
    '/deploy',
    handleAsync(async (c) => {
        const { repositoryId, imageName, options } = await c.req.json<{
            repositoryId: string;
            imageName: string;
            options?: DeployOptions;
        }>();

        return await containersStateManager.deploy(repositoryId, imageName, options);
    }),
);

export default app;
