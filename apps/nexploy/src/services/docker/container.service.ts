import { drinoDocker } from '@/lib/api/drinoDocker';
import { Container } from '@workspace/typescript-interface/docker/docker.container';

export async function getContainerByName(repositoryId: string): Promise<Container[]> {
    const name = `deploy-${repositoryId}`;

    return await drinoDocker.get<Container[]>(`/containers`, { queryParams: { name } }).consume();
}
