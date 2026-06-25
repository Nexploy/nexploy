import { getAllGitProviders } from '@/services/git/gitProviders.service';
import { GitBranch } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Accordion } from '@workspace/ui/components/accordion';
import { GitProviderAccordionItem } from '@/components/admin/integrations/GitProviderAccordionItem';
import { PROVIDER_ICONS } from '@/components/git/providerIcons.tsx';

export async function GitProvidersSection() {
    const [t, providers] = await Promise.all([
        getTranslations('integrations'),
        getAllGitProviders(),
    ]);

    return (
        <section className="space-y-2" data-tour="git-providers">
            <div className="flex items-center gap-2">
                <GitBranch className="text-muted-foreground size-4" />
                <h2 className="text-sm font-medium">{t('gitProviders')}</h2>
            </div>
            <Accordion
                type="multiple"
                className="flex flex-col gap-3"
                defaultValue={['github', 'gitlab', 'gitea']}
            >
                <GitProviderAccordionItem
                    value="github"
                    icon={<PROVIDER_ICONS.GITHUB className="size-5" />}
                    titleKey="github.title"
                    instances={providers.filter((p) => p.provider === 'GITHUB')}
                />
                <GitProviderAccordionItem
                    value="gitlab"
                    icon={<PROVIDER_ICONS.GITLAB className="size-5" />}
                    titleKey="gitlab.title"
                    instances={providers.filter((p) => p.provider === 'GITLAB')}
                />
                <GitProviderAccordionItem
                    value="gitea"
                    icon={<PROVIDER_ICONS.GITEA className="size-5" />}
                    titleKey="gitea.title"
                    instances={providers.filter((p) => p.provider === 'GITEA')}
                />
            </Accordion>
        </section>
    );
}
