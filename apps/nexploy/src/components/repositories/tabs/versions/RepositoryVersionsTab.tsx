import { RepositoryVersions } from '@/components/repositories/tabs/versions/RepositoryVersions';
import { getCompletedBuildsInngest } from '@/services/inngest/build.inngest.service';
import { getAllImageByName } from '@/services/docker/image.service';
import { getContainerByName } from '@/services/docker/container.service';

interface RepositoryVersionsTabProps {
    repositoryId: string;
}

export async function RepositoryVersionsTab({ repositoryId }: RepositoryVersionsTabProps) {
    const [versions, images, container] = await Promise.all([
        getCompletedBuildsInngest(repositoryId),
        getAllImageByName(repositoryId),
        getContainerByName(repositoryId),
    ]);

    return (
        <RepositoryVersions
            repositoryId={repositoryId}
            versions={versions}
            images={images}
            containerImageUsed={container[0]?.image}
        />
    );
}
