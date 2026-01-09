import { IntegrationCard } from '@/components/git/IntegrationCard';
import { CloudflareIntegrationCard } from '@/components/cloudflare/CloudflareIntegrationCard';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { getUserSession, listAccount } from '@/services/auth/auth.service';
import { getCloudflareCredentialInfo } from '@/services/cloudflare.service';
import { Cloud, GitBranch, Github, Gitlab, Plug } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function IntegrationsPage() {
    const accounts = await listAccount();
    const session = await getUserSession();
    const t = await getTranslations('integrations');

    const cloudflareInfo = session
        ? await getCloudflareCredentialInfo(session.user.id)
        : { isConnected: false };

    const getAccount = (provider: string) =>
        accounts.find((a) => a.providerId === provider) ?? null;

    const gitProviders = [
        {
            provider: 'github',
            name: t('github.title'),
            description: t('github.description'),
            icon: <Github className="size-5" />,
        },
        {
            provider: 'gitlab',
            name: t('gitlab.title'),
            description: t('gitlab.description'),
            icon: <Gitlab className="size-5" />,
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Plug className="text-primary size-7" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl leading-none font-semibold tracking-tight">
                            {t('title')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('description')}</p>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden px-5">
                    <div className="space-y-6 pb-6">
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <GitBranch className="text-muted-foreground size-4" />
                                <h2 className="text-sm font-medium">{t('gitProviders')}</h2>
                            </div>
                            <div className="space-y-2">
                                {gitProviders.map((p) => (
                                    <IntegrationCard
                                        key={p.provider}
                                        provider={p.provider}
                                        name={p.name}
                                        description={p.description}
                                        icon={p.icon}
                                        isConnected={!!getAccount(p.provider)}
                                    />
                                ))}
                            </div>
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Cloud className="text-muted-foreground size-4" />
                                <h2 className="text-sm font-medium">{t('cloudInfrastructure')}</h2>
                            </div>
                            <div className="space-y-2">
                                <CloudflareIntegrationCard
                                    isConnected={cloudflareInfo.isConnected}
                                />
                            </div>
                        </section>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
