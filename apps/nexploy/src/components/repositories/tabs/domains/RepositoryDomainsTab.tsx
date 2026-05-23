import { RepositoryDomains } from '@/components/repositories/tabs/domains/RepositoryDomains';
import { getDomainsFromTraefikConfig } from '@/services/traefik.service';
import { getAllCloudflareAccounts } from '@/services/cloudflare.service';
import { getAllCertificates } from '@/services/sslCertificate.service';
import { getUserSession } from '@/services/auth/auth.service';

interface RepositoryDomainsTabProps {
    repositoryId: string;
}

export async function RepositoryDomainsTab({ repositoryId }: RepositoryDomainsTabProps) {
    const [domainsConfig, session, certificates] = await Promise.all([
        getDomainsFromTraefikConfig(repositoryId),
        getUserSession(),
        getAllCertificates(),
    ]);

    const cloudflareAccounts = session ? await getAllCloudflareAccounts(session.user.id) : [];

    return (
        <div className="flex flex-col gap-5">
            <RepositoryDomains
                repositoryId={repositoryId}
                domainsConfig={domainsConfig}
                cloudflareAccounts={cloudflareAccounts}
                certificates={certificates}
            />
        </div>
    );
}
