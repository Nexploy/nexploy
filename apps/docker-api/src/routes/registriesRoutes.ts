import { Hono } from 'hono';
import { handleAsync } from '@/helpers/handleAsync';
import { logger } from '@/utils/logger';
import { writeDockerConfig, removeDockerConfig, validateRegistry } from '@/services/registryService';

const app = new Hono();

app.post(
    '/login',
    handleAsync(async (c) => {
        const { serveraddress, username, password } = await c.req.json<{
            serveraddress: string;
            username: string;
            password: string;
        }>();

        const valid = await validateRegistry(serveraddress, username, password);
        if (!valid) {
            throw new Error(`Cannot reach registry ${serveraddress}`);
        }

        writeDockerConfig(serveraddress, username, password);
        logger.info({ serveraddress }, 'docker login succeeded');

        return { success: true };
    }),
);

app.post(
    '/logout',
    handleAsync(async (c) => {
        const { serveraddress } = await c.req.json<{ serveraddress: string }>();
        removeDockerConfig(serveraddress);
        return { success: true };
    }),
);

export default app;
