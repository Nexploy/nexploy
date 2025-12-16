import Docker from 'dockerode';
import { env } from '../../env';
import { getCurrentDockerClient } from '@/lib/dockerContext';

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
