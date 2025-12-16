import { logger } from '@/utils/logger';
import { env } from '../../env';

interface EnvironmentConfig {
    id: string;
    name: string;
    connectionType: 'UNIX_SOCKET' | 'TCP' | 'TCP_TLS';
    socketPath?: string;
    host?: string;
    port?: number;
    tlsCert?: string;
    tlsKey?: string;
    tlsCa?: string;
    isDefault: boolean;
}

export async function loadEnvironmentsFromAPI(): Promise<EnvironmentConfig[]> {
    try {
        const apiUrl = `${env.NEXPLOY_API_URL}/api/environments`;

        logger.info({ apiUrl }, 'Loading environments from nexploy API');

        if (!env.INTERNAL_API_KEY) {
            throw new Error('INTERNAL_API_KEY environment variable is required');
        }

        const response = await fetch(apiUrl, {
            headers: {
                'x-api-key': env.INTERNAL_API_KEY,
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
                socketPath: env.DOCKER_SOCKET,
                isDefault: true,
            },
        ];
    }
}
