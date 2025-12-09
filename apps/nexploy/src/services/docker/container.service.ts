import { drinoDocker } from '@/lib/api/drinoDocker';
import { Container } from '@workspace/typescript-interface/docker/docker.container';
import { ContainerInfo } from 'dockerode';

export async function getContainerByName(repositoryId: string): Promise<Container[]> {
    try {
        const name = `nexploy-${repositoryId}`;

        return await drinoDocker
            .get<Container[]>(`/containers`, { queryParams: { name } })
            .consume();
    } catch {
        return [];
    }
}

export async function getContainerByProjectName(projectName: string): Promise<ContainerInfo[]> {
    try {
        return await drinoDocker.get<ContainerInfo[]>(`/composes/${projectName}/list`).consume();
    } catch {
        return [];
    }
}
