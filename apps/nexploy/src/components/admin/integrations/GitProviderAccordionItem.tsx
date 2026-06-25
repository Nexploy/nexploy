import { ProviderInstanceCard } from '@/components/admin/integrations/ProviderInstanceCard';
import { IntegrationsAddButtons } from '@/components/admin/integrations/IntegrationsAddButtons';
import { cn } from '@workspace/ui/lib/utils';
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import { GitProviderInfo } from '@/services/git/gitProviders.service';

type GitProviderAccordionItemProps = {
    value: 'github' | 'gitlab' | 'gitea';
    icon: ReactNode;
    titleKey: string;
    instances: GitProviderInfo[];
};

export async function GitProviderAccordionItem({
    value,
    icon,
    titleKey,
    instances,
}: GitProviderAccordionItemProps) {
    const t = await getTranslations('integrations');
    const hasInstances = instances.length > 0;

    return (
        <AccordionItem value={value} className="bg-card rounded-lg border !border-b">
            <AccordionTrigger
                position="left"
                showChevron={hasInstances}
                classNameChevron="size-5"
                className={cn('px-4 hover:no-underline', hasInstances && 'cursor-pointer')}
                headerChildren={
                    <div className="pr-4">
                        <IntegrationsAddButtons provider={value} />
                    </div>
                }
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                        {icon}
                    </div>
                    <div className="flex min-w-0 flex-col text-left">
                        <span>{t(titleKey)}</span>
                        <span className="text-muted-foreground text-xs">
                            ({t('oauth.instanceCount', { count: instances.length })})
                        </span>
                    </div>
                </div>
            </AccordionTrigger>
            {hasInstances && (
                <AccordionContent className="bg-muted/40 border-t p-5">
                    <div className="space-y-2">
                        {instances.map((instance) => (
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
    );
}
