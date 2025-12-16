import { AsyncLocalStorage } from 'async_hooks';
import Docker from 'dockerode';

interface DockerContext {
    environmentId: string;
    dockerClient: Docker;
    environmentName?: string;
}

export const dockerContextStorage = new AsyncLocalStorage<DockerContext>();

/**
 * Get the current Docker client from AsyncLocalStorage context
 * Falls back to default environment if no context is set
 */
export function getCurrentDockerClient(): Docker {
    const context = dockerContextStorage.getStore();
    if (context) {
        return context.dockerClient;
    }

    const { dockerClientRegistry } = require('@/lib/dockerClientRegistry');
    return dockerClientRegistry.getDefaultClient();
}

/**
 * Get the current environment ID from context
 */
export function getCurrentEnvironmentId(): string | undefined {
    const context = dockerContextStorage.getStore();
    return context?.environmentId;
}

/**
 * Get the current environment name from context
 */
export function getCurrentEnvironmentName(): string | undefined {
    const context = dockerContextStorage.getStore();
    return context?.environmentName;
}

/**
 * Run a function with a specific Docker environment context
 */
export function runWithDockerContext<T>(
    environmentId: string,
    dockerClient: Docker,
    fn: () => T,
    environmentName?: string,
): T {
    const context: DockerContext = { environmentId, dockerClient, environmentName };
    return dockerContextStorage.run(context, fn);
}
