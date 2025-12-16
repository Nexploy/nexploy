import { Context, Next } from 'hono';
import { logger } from '@/utils/logger';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { runWithDockerContext } from '@/lib/dockerContext';

export async function dockerEnvironmentMiddleware(c: Context, next: Next) {
    const environmentId = c.req.header('X-Docker-Environment') || c.req.query('environment');

    if (!environmentId) {
        const defaultId = dockerClientRegistry.getDefaultEnvironmentId();
        if (defaultId) {
            const client = dockerClientRegistry.getDefaultClient();
            return runWithDockerContext(defaultId, client, async () => {
                await next();
            });
        } else {
            logger.error('No Docker environment configured');
            return c.json({ error: 'No Docker environment configured' }, 500);
        }
    }

    try {
        const client = dockerClientRegistry.getClient(environmentId);

        return runWithDockerContext(environmentId, client, async () => {
            await next();
        });
    } catch (err: any) {
        logger.error({ err, environmentId }, 'Invalid Docker environment');
        return c.json({ error: `Docker environment not found: ${environmentId}` }, 404);
    }
}
