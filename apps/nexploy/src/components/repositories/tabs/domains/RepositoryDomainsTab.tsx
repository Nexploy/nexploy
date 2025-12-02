import { RepositoryDomains } from '@/components/repositories/tabs/domains/RepositoryDomains';
import { getRepositorieDomains } from '@/services/repositorie.service';

interface RepositoryDomainsTabProps {
    repositoryId: string;
}

export async function RepositoryDomainsTab({ repositoryId }: RepositoryDomainsTabProps) {
    const domains = await getRepositorieDomains(repositoryId);

    return <RepositoryDomains repositoryId={repositoryId} domains={domains} />;
}
