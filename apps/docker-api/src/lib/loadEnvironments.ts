import { HTTPError } from 'ky';
import { logger } from '@/utils/logger';
import { kyNexploy } from '@/lib/kyNexploy';
import { EnvironmentConfig } from '@workspace/typescript-interface/docker/environment/environment';

export async function loadEnvironmentsFromAPI(): Promise<EnvironmentConfig[]> {
    try {
        if (!process.env.NEXPLOY_API_KEY) {
            throw new Error('INTERNAL_API_KEY environment variable is required');
        }

        logger.info('Loading environments from nexploy API');

        const environments = await kyNexploy.get('environments').json<EnvironmentConfig[]>();

        logger.info({ count: environments.length }, 'Loaded environments from API');

        return environments;
    } catch (error) {
        logger.error({ error }, 'Failed to load environments from API, falling back to default');

        return [
            {
                id: 'default',
                name: 'Default Environment',
                connectionType: 'UNIX_SOCKET',
                socketPath: process.env.DOCKER_SOCKET,
                isDefault: true,
            },
        ];
    }
}

export async function loadEnvironmentByIdFromAPI(
    environmentId: string,
): Promise<EnvironmentConfig | null> {
    try {
        if (!process.env.NEXPLOY_API_KEY) {
            throw new Error('INTERNAL_API_KEY environment variable is required');
        }

        logger.info({ environmentId }, 'Loading specific environment from nexploy API');

        const environment = await kyNexploy
            .get(`environments/${environmentId}`)
            .json<EnvironmentConfig>();

        logger.info({ environmentId, name: environment.name }, 'Loaded environment from API');

        return environment;
    } catch (error) {
        if (error instanceof HTTPError && error.response.status === 404) {
            logger.warn({ environmentId }, 'Environment not found in database');
            return null;
        }

        logger.error({ error, environmentId }, 'Failed to load environment from API');
        return null;
    }
}
