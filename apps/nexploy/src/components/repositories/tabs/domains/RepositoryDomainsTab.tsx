import { RepositoryDomains } from '@/components/repositories/tabs/domains/RepositoryDomains';
import { getDomainsFromTraefikConfig } from '@/services/traefik.service';

interface RepositoryDomainsTabProps {
    repositoryId: string;
}

export async function RepositoryDomainsTab({ repositoryId }: RepositoryDomainsTabProps) {
    const domainsConfig = await getDomainsFromTraefikConfig(repositoryId);

    return <RepositoryDomains repositoryId={repositoryId} domainsConfig={domainsConfig} />;
}
