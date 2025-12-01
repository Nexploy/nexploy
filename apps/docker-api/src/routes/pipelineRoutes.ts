import { Hono } from 'hono';
import { containersStateManager } from '@/managers/containersStateManager';
import { handleAsync } from '@/helpers/handleAsync';

const app = new Hono();

app.post(
    '/deploy',
    handleAsync(async (c) => {
        const { projectId, imageName, options } = await c.req.json<{
            projectId: string;
            imageName: string;
            options?: {
                containerName?: string;
                port?: number;
                envVars?: Record<string, string>;
            };
        }>();

        return await containersStateManager.deploy(projectId, imageName, options);
    }),
);

export default app;
