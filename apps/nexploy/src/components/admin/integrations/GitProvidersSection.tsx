import { getAllGitProviders } from '@/services/oauthProvider.service';
import { GitBranch } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Accordion } from '@workspace/ui/components/accordion';
import { GitProviderAccordionItem } from '@/components/admin/integrations/GitProviderAccordionItem';
import { SiGithub, SiGitlab } from '@icons-pack/react-simple-icons';

export async function GitProvidersSection() {
    const [t, providers] = await Promise.all([
        getTranslations('integrations'),
        getAllGitProviders(),
    ]);

    return (
        <section className="space-y-2">
            <div className="flex items-center gap-2">
                <GitBranch className="text-muted-foreground size-4" />
                <h2 className="text-sm font-medium">{t('gitProviders')}</h2>
            </div>
            <Accordion
                type="multiple"
                className="flex flex-col gap-3"
                defaultValue={['github', 'gitlab']}
            >
                <GitProviderAccordionItem
                    value="github"
                    icon={<SiGithub className="size-5" />}
                    titleKey="github.title"
                    instances={providers.github}
                />
                <GitProviderAccordionItem
                    value="gitlab"
                    icon={<SiGitlab className="size-5" />}
                    titleKey="gitlab.title"
                    instances={providers.gitlab}
                />
            </Accordion>
        </section>
    );
}
