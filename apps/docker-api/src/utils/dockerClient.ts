import Docker from 'dockerode';
import { getCurrentDockerClient } from '@/lib/dockerContext';
import { DOCKER_SOCKET_PATH } from '@/lib/config';
import { agentSocketPath } from '@/lib/agentBridge';
import { EnvironmentSchemaType } from '@workspace/schemas-zod/docker/environment/environment.schema';

export const defaultDocker = new Docker({
    socketPath: DOCKER_SOCKET_PATH,
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
            return new Docker({ socketPath: config.socketPath || DOCKER_SOCKET_PATH });

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

        case 'AGENT':
            return new Docker({ socketPath: agentSocketPath(config.id!) });

        default:
            throw new Error(`Unknown connection type: ${(config as any).connectionType}`);
    }
}
