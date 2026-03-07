import { RepositoryVersions } from '@/components/repositories/tabs/versions/RepositoryVersions';
import { getVersionsByRepository } from '@/services/docker/version.service';
import { getContainerByName } from '@/services/docker/container.service';

interface RepositoryVersionsTabProps {
    repositoryId: string;
}

export async function RepositoryVersionsTab({ repositoryId }: RepositoryVersionsTabProps) {
    const versions = await getVersionsByRepository(repositoryId);

    const environmentIds = [...new Set(versions.map((v) => v.environmentId))];

    const deployedImageByEnvironment: Record<string, string> = {};

    await Promise.all(
        environmentIds.map(async (environmentId) => {
            const key = environmentId ?? '';
            const containers = await getContainerByName(repositoryId, environmentId);
            if (containers[0]?.image) {
                deployedImageByEnvironment[key] = containers[0].image;
            }
        }),
    );

    return (
        <RepositoryVersions
            repositoryId={repositoryId}
            versions={versions}
            deployedImageByEnvironment={deployedImageByEnvironment}
        />
    );
}
