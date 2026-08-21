import { getTranslations } from 'next-intl/server';
import { IntegrationCard } from '@/components/git/IntegrationCard';
import { PROVIDER_ICONS } from '@/components/git/providerIcons';
import { getAllGitProviders } from '@/services/git/gitProviders.service';
import { listGitAccounts } from '@/services/git/gitAccounts.service';
import { getUserSession } from '@/services/auth/auth.service';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plug } from 'lucide-react';

export async function AcountIntegrations() {
    const session = await getUserSession();
    if (!session) return null;

    const accounts = await listGitAccounts(session.user.id);
    const t = await getTranslations('integrations');
    const providers = await getAllGitProviders();

    if (providers.length === 0) {
        return (
            <EmptyState
                icon={Plug}
                title={t('oauth.noProvidersAvailable')}
                description={t('oauth.noProvidersAvailableDescription')}
            />
        );
    }

    return (
        <div className="space-y-2">
            {providers.map((instance) => {
                const isOrg = instance.ownerType === 'Organization';
                const subtitle = isOrg ? instance.ownerName : undefined;
                const ProviderIcon = PROVIDER_ICONS[instance.provider];

                return (
                    <IntegrationCard
                        key={instance.id}
                        gitProviderId={instance.id}
                        name={instance.displayName}
                        description={t(`${instance.provider.toLowerCase()}.description`)}
                        subtitle={subtitle}
                        isOrg={isOrg}
                        icon={<ProviderIcon className="size-5" />}
                        isConnected={accounts.some((a) => a.gitProviderId === instance.id)}
                    />
                );
            })}
        </div>
    );
}
