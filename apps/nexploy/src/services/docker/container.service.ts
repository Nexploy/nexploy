import { Container } from '@workspace/typescript-interface/docker/docker.container';
import { ContainerInfo, ContainerInspectInfo } from 'dockerode';
import { kyDocker, type KyDockerOptions } from '@/lib/api/kyDocker';

export async function getContainerByName(
    repositoryId: string,
    environmentId?: string,
): Promise<Container[]> {
    try {
        const name = `nexploy-${repositoryId}`;
        return await kyDocker
            .get(`containers`, {
                searchParams: { name },
                environmentId,
            } as KyDockerOptions)
            .json<Container[]>();
    } catch {
        return [] as Container[];
    }
}

export async function getContainerByProjectName(
    projectName: string,
    environmentId?: string,
): Promise<ContainerInfo[]> {
    try {
        return await kyDocker
            .get(`composes/${projectName}/list`, { environmentId } as KyDockerOptions)
            .json<ContainerInfo[]>();
    } catch {
        return [];
    }
}

export async function getDeployedComposeImageTag(
    repositoryId: string,
    environmentId?: string,
): Promise<string | undefined> {
    try {
        const projectName = `nexploy-${repositoryId}`;
        const containers = await kyDocker
            .get(`composes/${projectName}/list`, { environmentId } as KyDockerOptions)
            .json<ContainerInfo[]>();
        for (const container of containers) {
            const tag = container.Labels?.['nexploy.imageTag'];
            if (tag) return tag;
        }
        return undefined;
    } catch {
        return undefined;
    }
}

export async function getContainerPortMappings(
    containerNameOrId: string,
    environmentId?: string,
): Promise<Record<number, number>> {
    try {
        const inspectInfo = await kyDocker
            .get(`container/${containerNameOrId}/info`, {
                environmentId,
            } as KyDockerOptions)
            .json<ContainerInspectInfo>();

        const mappings: Record<number, number> = {};
        const ports = inspectInfo.NetworkSettings?.Ports || {};

        for (const [portKey, bindings] of Object.entries(ports)) {
            const containerPort = parseInt(portKey.split('/')[0] ?? '0');
            if (bindings?.[0]?.HostPort) {
                mappings[containerPort] = parseInt(bindings[0].HostPort);
            }
        }

        return mappings;
    } catch {
        return {};
    }
}
