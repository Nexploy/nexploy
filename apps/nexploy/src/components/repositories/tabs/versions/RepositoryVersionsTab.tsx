import { RepositoryVersions } from '@/components/repositories/tabs/versions/RepositoryVersions';
import { getVersionsByRepository } from '@/services/docker/version.service';
import {
    getContainerByName,
    getDeployedComposeImageTag,
} from '@/services/docker/container.service';

interface RepositoryVersionsTabProps {
    repositoryId: string;
}

export async function RepositoryVersionsTab({ repositoryId }: RepositoryVersionsTabProps) {
    const versions = await getVersionsByRepository(repositoryId);

    const environmentIds = [...new Set(versions.map((v) => v.environmentId))];

    const deployedTagByEnvironment: Record<string, string> = {};

    await Promise.all(
        environmentIds.map(async (environmentId) => {
            const key = environmentId ?? '';

            // Try single container first (Dockerfile deployments)
            const containers = await getContainerByName(repositoryId, environmentId);
            const singleImageTag = containers[0]?.image?.split(':').at(-1);
            if (singleImageTag) {
                deployedTagByEnvironment[key] = singleImageTag;
                return;
            }

            // Fall back to compose stack (labels-based detection)
            const composeImageTag = await getDeployedComposeImageTag(repositoryId, environmentId);
            if (composeImageTag) {
                deployedTagByEnvironment[key] = composeImageTag;
            }
        }),
    );

    return (
        <RepositoryVersions
            repositoryId={repositoryId}
            versions={versions}
            deployedTagByEnvironment={deployedTagByEnvironment}
        />
    );
}
