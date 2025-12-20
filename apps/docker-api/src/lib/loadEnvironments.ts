import { logger } from '@/utils/logger';
import { EnvironmentConfig } from '@workspace/typescript-interface/docker/environment/environment';

export async function loadEnvironmentsFromAPI(): Promise<EnvironmentConfig[]> {
    try {
        const apiUrl = `${process.env.NEXPLOY_API_URL}/api/environments`;

        logger.info({ apiUrl }, 'Loading environments from nexploy API');

        if (!process.env.INTERNAL_API_KEY) {
            throw new Error('INTERNAL_API_KEY environment variable is required');
        }

        const response = await fetch(apiUrl, {
            headers: {
                'x-api-key': process.env.INTERNAL_API_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(
                `Failed to fetch environments: ${response.status} ${response.statusText}`,
            );
        }

        const environments = (await response.json()) as EnvironmentConfig[];

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
        const apiUrl = `${process.env.NEXPLOY_API_URL}/api/environments/${environmentId}`;

        logger.info({ apiUrl, environmentId }, 'Loading specific environment from nexploy API');

        if (!process.env.INTERNAL_API_KEY) {
            throw new Error('INTERNAL_API_KEY environment variable is required');
        }

        const response = await fetch(apiUrl, {
            headers: {
                'x-api-key': process.env.INTERNAL_API_KEY,
            },
        });

        console.log(response);

        if (!response.ok) {
            if (response.status === 404) {
                logger.warn({ environmentId }, 'Environment not found in database');
                return null;
            }
            throw new Error(
                `Failed to fetch environment: ${response.status} ${response.statusText}`,
            );
        }

        const environment = (await response.json()) as EnvironmentConfig;

        logger.info({ environmentId, name: environment.name }, 'Loaded environment from API');

        return environment;
    } catch (error) {
        logger.error({ error, environmentId }, 'Failed to load environment from API');
        return null;
    }
}
