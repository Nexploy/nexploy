import { Hono } from 'hono';
import { route } from '@/utils/route';
import { logger } from '@/utils/logger';
import { writeDockerConfig, removeDockerConfig, validateRegistry } from '@/services/registryService';
import {
    registryLoginSchema,
    registryLogoutSchema,
} from '@workspace/schemas-zod/docker/registry/registryAction.schema';

const app = new Hono();

app.post(
    '/login',
    route({ json: registryLoginSchema }, async (c) => {
        const { serveraddress, username, password } = c.req.valid('json');

        const valid = validateRegistry(serveraddress, username, password);
        if (!valid) {
            throw new Error(`Authentication failed for registry ${serveraddress}`);
        }

        writeDockerConfig(serveraddress, username, password);
        logger.info({ serveraddress }, 'docker login succeeded');

        return { success: true };
    }),
);

app.post(
    '/logout',
    route({ json: registryLogoutSchema }, async (c) => {
        const { serveraddress } = c.req.valid('json');
        removeDockerConfig(serveraddress);
        return { success: true };
    }),
);

export default app;
