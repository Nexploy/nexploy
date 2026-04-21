import { RepositoryVersions } from '@/components/repositories/tabs/versions/RepositoryVersions';
import { getVersionsByRepository } from '@/services/docker/version.service';

interface RepositoryVersionsTabProps {
    repositoryId: string;
}

export async function RepositoryVersionsTab({ repositoryId }: RepositoryVersionsTabProps) {
    const versions = await getVersionsByRepository(repositoryId);

    return <RepositoryVersions repositoryId={repositoryId} versions={versions} />;
}
