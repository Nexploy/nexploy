import { Context, Next } from 'hono';
import { logger } from '@/utils/logger';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { runWithDockerContext } from '@/lib/dockerContext';
import { loadEnvironmentByIdFromAPI } from '@/lib/loadEnvironments';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import { getTranslations } from '@/middleware/locale.middleware';

export async function dockerEnvironmentMiddleware(c: Context, next: Next) {
    if (c.req.path.startsWith('/api/environments')) {
        return next();
    }

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
            const t = getTranslations(c, 'docker');
            return c.json({ error: t('errors.noDockerEnvironment') }, 500);
        }
    }

    try {
        const client = dockerClientRegistry.getClient(environmentId);

        return runWithDockerContext(environmentId, client, async () => {
            await next();
        });
    } catch (err: any) {
        logger.info(
            { environmentId },
            'Environment not in registry, attempting on-demand initialization',
        );

        try {
            const environmentConfig = await loadEnvironmentByIdFromAPI(environmentId);

            if (!environmentConfig) {
                logger.warn({ environmentId }, 'Environment not found in database');
                const t = getTranslations(c, 'docker');
                return c.json(
                    {
                        error: t('errors.environmentNotFound', { id: environmentId }),
                        code: 'ENVIRONMENT_NOT_FOUND',
                        environmentId,
                    },
                    404,
                );
            }

            logger.info(
                { environmentId, name: environmentConfig.name },
                'Attempting to register environment',
            );
            const client = await dockerClientRegistry.registerEnvironment(environmentConfig);

            logger.info({ environmentId }, 'Initializing state managers for environment');
            await stateManagerFactory.initializeEnvironment(environmentId);

            logger.info(
                { environmentId, name: environmentConfig.name },
                'Successfully registered and initialized environment on-demand',
            );

            return runWithDockerContext(environmentId, client, async () => {
                await next();
            });
        } catch (registerErr: any) {
            logger.error(
                { err: registerErr, environmentId },
                'Failed to register environment on-demand',
            );
            const t = getTranslations(c, 'docker');
            return c.json(
                {
                    error: t('errors.environmentUnavailable', { id: environmentId, message: registerErr.message }),
                    code: 'ENVIRONMENT_UNAVAILABLE',
                    environmentId,
                },
                503,
            );
        }
    }
}
