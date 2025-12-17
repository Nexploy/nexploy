import Docker from 'dockerode';
import { env } from '../../env';
import { getCurrentDockerClient } from '@/lib/dockerContext';
import { EnvironmentSchemaType } from '@workspace/schemas-zod/docker/environment/environment.schema';

export const defaultDocker = new Docker({
    socketPath: env.DOCKER_SOCKET,
});

export const docker = new Proxy({} as Docker, {
    get(_target, prop) {
        const client = getCurrentDockerClient();
        const value = (client as any)[prop];

        if (typeof value === 'function') {
            return value.bind(client);
        }

        return value;
    },
});

export function createDockerClient(config: EnvironmentSchemaType): Docker {
    switch (config.connectionType) {
        case 'UNIX_SOCKET':
            return new Docker({ socketPath: config.socketPath });

        case 'TCP':
            return new Docker({
                host: config.host,
                port: config.port,
            });

        case 'TCP_TLS':
            return new Docker({
                host: config.host,
                port: config.port,
                ca: config.tlsCa,
                cert: config.tlsCert,
                key: config.tlsKey,
            });

        default:
            throw new Error(`Unknown connection type: ${(config as any).connectionType}`);
    }
}
