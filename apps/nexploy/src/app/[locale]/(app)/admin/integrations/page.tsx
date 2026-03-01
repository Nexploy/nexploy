import { ProviderInstanceCard } from '@/components/admin/integrations/ProviderInstanceCard';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { getUserSession } from '@/services/auth/auth.service';
import { getCloudflareCredentialInfo } from '@/services/cloudflare.service';
import { getAllGitProviders } from '@/services/oauthProvider.service';
import { ChevronDownIcon, Cloud, GitBranch, Github, Gitlab, Plug } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { IntegrationsAddButtons } from '@/components/admin/integrations/IntegrationsAddButtons';
import { CloudflareIntegrationCard } from '@/components/admin/integrations/CloudflareIntegrationCard';
import * as React from 'react';
import { cn } from '@workspace/ui/lib/utils';

export default async function IntegrationsPage() {
    const [session, t, providers] = await Promise.all([
        getUserSession(),
        getTranslations('integrations'),
        getAllGitProviders(),
    ]);

    const cloudflareInfo = session
        ? await getCloudflareCredentialInfo(session.user.id)
        : { isConnected: false };

    const hasGithubApps = providers.github.length;
    const hasGitlabApps = providers.gitlab.length;

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
                    <div className="space-y-6 pb-5">
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <GitBranch className="text-muted-foreground size-4" />
                                <h2 className="text-sm font-medium">{t('gitProviders')}</h2>
                            </div>
                            <Accordion
                                type="multiple"
                                className={'flex flex-col gap-3'}
                                defaultValue={['github', 'gitlab']}
                            >
                                <AccordionItem
                                    value="github"
                                    className="bg-card rounded-lg border !border-b"
                                >
                                    <AccordionTrigger
                                        asChild
                                        className={cn(
                                            'px-4 hover:no-underline',
                                            hasGithubApps && 'cursor-pointer',
                                        )}
                                    >
                                        <div className="flex w-full flex-1">
                                            {!!hasGithubApps && (
                                                <ChevronDownIcon className="text-muted-foreground size-5 self-center transition-transform duration-200" />
                                            )}
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                                                    <Github className="size-5" />
                                                </div>
                                                <div className="flex min-w-0 flex-col text-left">
                                                    <span>{t('github.title')}</span>
                                                    <span className="text-muted-foreground text-xs font-normal">
                                                        (
                                                        {t('oauth.instanceCount', {
                                                            count: providers.github.length,
                                                        })}
                                                        )
                                                    </span>
                                                </div>
                                            </div>
                                            <IntegrationsAddButtons provider="github" />
                                        </div>
                                    </AccordionTrigger>
                                    {!!hasGithubApps && (
                                        <AccordionContent className="bg-muted/40 border-t p-5">
                                            <div className="space-y-2">
                                                {providers.github.map((instance) => (
                                                    <ProviderInstanceCard
                                                        key={instance.id}
                                                        id={instance.id}
                                                        displayName={instance.displayName}
                                                        appName={instance.appName}
                                                        maskedClientId={instance.maskedClientId}
                                                    />
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    )}
                                </AccordionItem>

                                <AccordionItem
                                    value="gitlab"
                                    className="bg-card rounded-lg border !border-b"
                                >
                                    <AccordionTrigger
                                        asChild
                                        className={cn(
                                            'px-4 hover:no-underline',
                                            hasGitlabApps && 'cursor-pointer',
                                        )}
                                    >
                                        <div className="flex w-full flex-1">
                                            {!!hasGitlabApps && (
                                                <ChevronDownIcon className="text-muted-foreground size-5 self-center transition-transform duration-200" />
                                            )}
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                                                    <Gitlab className="size-5" />
                                                </div>
                                                <div className="flex min-w-0 flex-col text-left">
                                                    <span>{t('gitlab.title')}</span>
                                                    <span className="text-muted-foreground text-xs font-normal">
                                                        (
                                                        {t('oauth.instanceCount', {
                                                            count: providers.gitlab.length,
                                                        })}
                                                        )
                                                    </span>
                                                </div>
                                            </div>
                                            <IntegrationsAddButtons provider="gitlab" />
                                        </div>
                                    </AccordionTrigger>
                                    {!!hasGitlabApps && (
                                        <AccordionContent className="bg-muted/40 border-t p-5">
                                            <div className="space-y-2">
                                                {providers.gitlab.map((instance) => (
                                                    <ProviderInstanceCard
                                                        key={instance.id}
                                                        id={instance.id}
                                                        displayName={instance.displayName}
                                                        appName={instance.appName}
                                                        maskedClientId={instance.maskedClientId}
                                                    />
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    )}
                                </AccordionItem>
                            </Accordion>
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
