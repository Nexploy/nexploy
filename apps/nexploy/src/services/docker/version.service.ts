import { kyDocker } from '@/lib/api/kyDocker';
import { Version } from '@workspace/typescript-interface/docker/docker.version';

export async function getVersionsByRepository(repositoryId: string): Promise<Version[]> {
    try {
        return await kyDocker
            .get('images/versions', {
                searchParams: { repositoryId },
            })
            .json<Version[]>();
    } catch {
        return [];
    }
}
