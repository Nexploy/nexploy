import { Hono } from 'hono';
import { logger } from '@/utils/logger';
import { dockerClientRegistry } from '@/lib/dockerClientRegistry';
import { stateManagerFactory } from '@/managers/factory/StateManagerFactory';
import { zValidator } from '@hono/zod-validator';
import {
    environmentIdSchema,
    environmentSchema,
} from '@workspace/schemas-zod/docker/environment/environment.schema';
import { handleAsync } from '@/helpers/handleAsync';
import { getValidatedJson, getValidatedParam } from '@/helpers/validation';
import { createDockerClient } from '@/utils/dockerClient';
import { getTranslations } from '@/middleware/locale.middleware';
import { HttpError } from '@workspace/shared/http-error';

const app = new Hono();

app.post(
    '/validate',
    zValidator('json', environmentSchema),
    handleAsync(async (c) => {
        const config = getValidatedJson(c, environmentSchema);

        logger.info({ name: config.name }, 'Validating environment configuration');

        const tempClient = createDockerClient(config);
        try {
            await tempClient.ping();
        } catch (err: any) {
            const t = getTranslations(c, 'docker');
            throw new HttpError(
                t('errors.dockerHostUnreachable', { host: config.host ?? config.socketPath ?? 'unknown', error: err.message }),
                400,
            );
        }

        logger.info('Environment validation successful');

        const t = getTranslations(c, 'docker');
        return {
            valid: true,
            message: t('errors.dockerConnectionSuccess'),
        };
    }),
);

app.post(
    '/register',
    zValidator('json', environmentSchema),
    handleAsync(async (c) => {
        const config = getValidatedJson(c, environmentSchema);

        logger.info({ environmentId: config.id, name: config.name }, 'Registering new environment');

        try {
            await dockerClientRegistry.registerEnvironment(config);
            await stateManagerFactory.initializeEnvironment(config.id!);

            logger.info({ environmentId: config.id }, 'Environment registered successfully');

            const t = getTranslations(c, 'docker');
            return {
                success: true,
                message: t('errors.environmentRegistered'),
                environmentId: config.id,
            };
        } catch (err: any) {
            logger.error({ err, environmentId: config.id }, 'Failed to register environment');

            try {
                await dockerClientRegistry.unregisterEnvironment(config.id!);
            } catch (cleanupErr) {
                logger.error({ err: cleanupErr }, 'Failed to cleanup after registration failure');
            }

            throw err;
        }
    }),
);

app.delete(
    '/:environmentId',
    zValidator('param', environmentIdSchema),
    handleAsync(async (c) => {
        const { environmentId } = getValidatedParam(c, environmentIdSchema);

        logger.info({ environmentId }, 'Unregistering environment');

        await stateManagerFactory.shutdownEnvironment(environmentId);
        await dockerClientRegistry.unregisterEnvironment(environmentId);

        logger.info({ environmentId }, 'Environment unregistered successfully');

        const t = getTranslations(c, 'docker');
        return {
            success: true,
            message: t('errors.environmentUnregistered'),
        };
    }),
);

app.patch(
    '/:environmentId',
    zValidator('param', environmentIdSchema),
    zValidator('json', environmentSchema),
    handleAsync(async (c) => {
        const { environmentId } = getValidatedParam(c, environmentIdSchema);
        const config = getValidatedJson(c, environmentSchema);

        logger.info({ environmentId, name: config.name }, 'Updating environment configuration');

        if (environmentId !== config.id) {
            const t = getTranslations(c, 'docker');
            throw new HttpError(t('errors.environmentIdMismatch'), 400);
        }

        const tempClient = createDockerClient(config);
        try {
            await tempClient.ping();
        } catch (err: any) {
            const t = getTranslations(c, 'docker');
            throw new HttpError(
                t('errors.dockerHostUnreachable', { host: config.host ?? config.socketPath ?? 'unknown', error: err.message }),
                400,
            );
        }

        await stateManagerFactory.shutdownEnvironment(environmentId);
        await dockerClientRegistry.reloadEnvironment(config);
        await stateManagerFactory.initializeEnvironment(environmentId);

        logger.info({ environmentId }, 'Environment updated successfully');

        const t = getTranslations(c, 'docker');
        return {
            success: true,
            message: t('errors.environmentUpdated'),
            environmentId,
        };
    }),
);

export default app;
