import { Container } from '@workspace/typescript-interface/docker/docker.container';
import { ContainerInfo } from 'dockerode';
import { kyDocker } from '@/lib/api/kyDocker';

export async function getContainerByName(repositoryId: string): Promise<Container[]> {
    try {
        const name = `nexploy-${repositoryId}`;

        return await kyDocker
            .get(`containers`, {
                searchParams: { name },
            })
            .json<Container[]>();
    } catch {
        return [];
    }
}

export async function getContainerByProjectName(projectName: string): Promise<ContainerInfo[]> {
    try {
        return await kyDocker.get(`composes/${projectName}/list`).json<ContainerInfo[]>();
    } catch {
        return [];
    }
}
