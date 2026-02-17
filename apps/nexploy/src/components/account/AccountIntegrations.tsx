import { Github, Gitlab } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { IntegrationCard } from '@/components/git/IntegrationCard';
import { getAllGitProviders } from '@/services/oauthProvider.service';
import { listGitAccounts } from '@/services/git/git.service';
import { getUserSession } from '@/services/auth/auth.service';

export async function AcountIntegrations() {
    const session = await getUserSession();
    if (!session) return null;

    const accounts = await listGitAccounts(session.user.id);
    const t = await getTranslations('integrations');

    const providers = await getAllGitProviders();

    const hasAccount = (provider: string) =>
        accounts.some((a) => a.provider === provider);

    const hasGithub = providers.github.length > 0;
    const hasGitlab = providers.gitlab.length > 0;

    const allProviders = [
        ...(hasGithub
            ? [
                  {
                      provider: 'github',
                      name: t('github.title'),
                      description: t('github.description'),
                      icon: <Github className="size-5" />,
                      available: true,
                  },
              ]
            : []),
        ...(hasGitlab
            ? [
                  {
                      provider: 'gitlab',
                      name: t('gitlab.title'),
                      description: t('gitlab.description'),
                      icon: <Gitlab className="size-5" />,
                      available: true,
                  },
              ]
            : []),
    ];

    if (allProviders.length === 0) {
        return (
            <p className="text-muted-foreground rounded-md border p-3 text-center text-sm">
                {t('oauth.noProvidersAvailable')}
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {allProviders.map((git) => (
                <IntegrationCard
                    key={git.provider}
                    provider={git.provider}
                    name={git.name}
                    description={git.description}
                    icon={git.icon}
                    isConnected={hasAccount(git.provider)}
                />
            ))}
        </div>
    );
}
