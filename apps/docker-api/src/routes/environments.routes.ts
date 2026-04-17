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
            throw new HttpError(
                `Cannot connect to Docker host ${config.host ?? config.socketPath ?? 'unknown'}: ${err.message}`,
                400,
            );
        }

        logger.info('Environment validation successful');

        return {
            valid: true,
            message: 'Docker connection successful.',
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

            return {
                success: true,
                message: 'Environment registered successfully.',
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

        return {
            success: true,
            message: 'Environment unregistered successfully.',
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
            throw new HttpError('Environment ID mismatch.', 400);
        }

        const tempClient = createDockerClient(config);
        try {
            await tempClient.ping();
        } catch (err: any) {
            throw new HttpError(
                `Cannot connect to Docker host ${config.host ?? config.socketPath ?? 'unknown'}: ${err.message}`,
                400,
            );
        }

        await stateManagerFactory.shutdownEnvironment(environmentId);
        await dockerClientRegistry.reloadEnvironment(config);
        await stateManagerFactory.initializeEnvironment(environmentId);

        logger.info({ environmentId }, 'Environment updated successfully');

        return {
            success: true,
            message: 'Environment updated successfully.',
            environmentId,
        };
    }),
);

export default app;
