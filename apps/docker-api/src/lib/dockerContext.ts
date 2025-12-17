import { AsyncLocalStorage } from 'async_hooks';
import Docker from 'dockerode';

interface DockerContext {
    environmentId: string;
    dockerClient: Docker;
    environmentName?: string;
}

export const dockerContextStorage = new AsyncLocalStorage<DockerContext>();

export function getCurrentDockerClient(): Docker {
    const context = dockerContextStorage.getStore();
    if (context) {
        return context.dockerClient;
    }

    const { dockerClientRegistry } = require('@/lib/dockerClientRegistry');
    return dockerClientRegistry.getDefaultClient();
}

export function getCurrentEnvironmentId(): string | undefined {
    const context = dockerContextStorage.getStore();
    return context?.environmentId;
}

export function getCurrentEnvironmentName(): string | undefined {
    const context = dockerContextStorage.getStore();
    return context?.environmentName;
}

export function runWithDockerContext<T>(
    environmentId: string,
    dockerClient: Docker,
    fn: () => T,
    environmentName?: string,
): T {
    const context: DockerContext = { environmentId, dockerClient, environmentName };
    return dockerContextStorage.run(context, fn);
}
