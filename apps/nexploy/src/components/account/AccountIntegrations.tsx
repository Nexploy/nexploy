import { getTranslations } from 'next-intl/server';
import { IntegrationCard } from '@/components/git/IntegrationCard';
import { providerIcons } from '@/components/git/providerIcons';
import { getAllGitProviders } from '@/services/oauthProvider.service';
import { listGitAccounts } from '@/services/git/git.service';
import { getUserSession } from '@/services/auth/auth.service';

export async function AcountIntegrations() {
    const session = await getUserSession();
    if (!session) return null;

    const accounts = await listGitAccounts(session.user.id);
    const t = await getTranslations('integrations');
    const providers = await getAllGitProviders();

    const allInstances = [...providers.github, ...providers.gitlab];

    if (allInstances.length === 0) {
        return (
            <p className="text-muted-foreground rounded-md border p-3 text-center text-sm">
                {t('oauth.noProvidersAvailable')}
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {allInstances.map((instance) => {
                const providerType = providers.github.includes(instance) ? 'github' : 'gitlab';
                const isOrg = instance.ownerType === 'Organization';
                const subtitle = isOrg ? instance.ownerName : undefined;

                return (
                    <IntegrationCard
                        key={instance.id}
                        gitProviderId={instance.id}
                        provider={providerType}
                        name={instance.displayName}
                        description={t(`${providerType}.description`)}
                        subtitle={subtitle}
                        isOrg={isOrg}
                        icon={providerIcons[providerType]}
                        isConnected={accounts.some((a) => a.gitProviderId === instance.id)}
                    />
                );
            })}
        </div>
    );
}
