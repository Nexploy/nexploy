import { RepositoryVersions } from '@/components/repositories/tabs/versions/RepositoryVersions';
import { getVersionsByRepository } from '@/services/docker/version.service';
import { getContainerByName, getContainerByProjectName } from '@/services/docker/container.service';
import type { BuildType } from 'generated/client';

interface RepositoryVersionsTabProps {
    repositoryId: string;
    buildType: BuildType;
}

export async function RepositoryVersionsTab({
    repositoryId,
    buildType,
}: RepositoryVersionsTabProps) {
    const versions = await getVersionsByRepository(repositoryId);

    const environmentIds = [...new Set(versions.map((v) => v.environmentId))];

    const deployedImageByEnvironment: Record<string, string> = {};

    await Promise.all(
        environmentIds.map(async (environmentId) => {
            const key = environmentId ?? '';

            if (buildType === 'DOCKER_COMPOSE') {
                const composeContainers = await getContainerByProjectName(
                    `nexploy-${repositoryId}`,
                    environmentId,
                );
                if (composeContainers.length > 0) {
                    const firstImage = composeContainers[0]?.Image;
                    if (firstImage) {
                        const tag = firstImage.split(':')[1];
                        if (tag) {
                            deployedImageByEnvironment[key] = `${repositoryId}:${tag}`;
                        }
                    }
                }
            } else {
                const containers = await getContainerByName(repositoryId, environmentId);
                if (containers[0]?.image) {
                    deployedImageByEnvironment[key] = containers[0].image;
                }
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
