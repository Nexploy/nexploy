import { RepositoryVersions } from '@/components/repositories/tabs/versions/RepositoryVersions';
import { getCompletedBuildsInngest } from '@/services/inngest/build.inngest.service';
import { getAllImageByName } from '@/services/docker/image.service';
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
    const [versions, images, container] = await Promise.all([
        getCompletedBuildsInngest(repositoryId),
        getAllImageByName(repositoryId),
        getContainerByName(repositoryId),
    ]);

    let containerImageUsed = container[0]?.image;

    if (buildType === 'DOCKER_COMPOSE' && !containerImageUsed) {
        const composeContainers = await getContainerByProjectName(`nexploy-${repositoryId}`);
        if (composeContainers.length > 0) {
            const firstImage = composeContainers[0]?.Image;
            if (firstImage) {
                const tag = firstImage.split(':')[1];
                if (tag) {
                    containerImageUsed = `${repositoryId}:${tag}`;
                }
            }
        }
    }

    return (
        <RepositoryVersions
            repositoryId={repositoryId}
            versions={versions}
            images={images}
            containerImageUsed={containerImageUsed}
        />
    );
}
