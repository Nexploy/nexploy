import { RepositoryDomains } from '@/components/repositories/tabs/domains/RepositoryDomains';
import { getDomainsFromTraefikConfig } from '@/services/traefik.service';
import { getCloudflareCredentialInfo } from '@/services/cloudflare.service';
import { getUserSession } from '@/services/auth/auth.service';

interface RepositoryDomainsTabProps {
    repositoryId: string;
}

export async function RepositoryDomainsTab({ repositoryId }: RepositoryDomainsTabProps) {
    const domainsConfig = await getDomainsFromTraefikConfig(repositoryId);
    const session = await getUserSession();

    const cloudflareInfo = session
        ? await getCloudflareCredentialInfo(session.user.id)
        : { isConnected: false };

    return (
        <RepositoryDomains
            repositoryId={repositoryId}
            domainsConfig={domainsConfig}
            isCloudflareConnected={cloudflareInfo.isConnected}
        />
    );
}
