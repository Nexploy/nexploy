import { RepositoryDomains } from '@/components/repositories/tabs/domains/RepositoryDomains';
import { getDomainsFromTraefikConfig } from '@/services/traefik.service';
import { getAllCloudflareAccounts } from '@/services/cloudflare.service';
import { getUserSession } from '@/services/auth/auth.service';

interface RepositoryDomainsTabProps {
    repositoryId: string;
}

export async function RepositoryDomainsTab({ repositoryId }: RepositoryDomainsTabProps) {
    const [domainsConfig, session] = await Promise.all([
        getDomainsFromTraefikConfig(repositoryId),
        getUserSession(),
    ]);

    const cloudflareAccounts = session ? await getAllCloudflareAccounts(session.user.id) : [];

    return (
        <RepositoryDomains
            repositoryId={repositoryId}
            domainsConfig={domainsConfig}
            cloudflareAccounts={cloudflareAccounts}
        />
    );
}
