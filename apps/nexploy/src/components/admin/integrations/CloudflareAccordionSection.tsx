import { type CloudflareAccountInfo } from '@workspace/typescript-interface/cloudflare/cloudflare';
import { Cloud } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { CloudflareAddButton } from '@/components/admin/integrations/CloudflareAddButton';
import { CloudflareInstanceCard } from '@/components/admin/integrations/CloudflareInstanceCard';
import { cn } from '@workspace/ui/lib/utils';

interface CloudflareAccordionSectionProps {
    accounts: CloudflareAccountInfo[];
}

export async function CloudflareAccordionSection({ accounts }: CloudflareAccordionSectionProps) {
    const t = await getTranslations('integrations');
    const hasAccounts = accounts.length > 0;

    return (
        <Accordion type="multiple" className="flex flex-col gap-3" defaultValue={['cloudflare']}>
            <AccordionItem value="cloudflare" className="bg-card rounded-lg border !border-b">
                <AccordionTrigger
                    position="left"
                    showChevron={hasAccounts}
                    classNameChevron="size-5"
                    className={cn('px-4 hover:no-underline', hasAccounts && 'cursor-pointer')}
                    headerChildren={
                        <div className="pr-4">
                            <CloudflareAddButton />
                        </div>
                    }
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                            <Cloud className="size-5" />
                        </div>
                        <div className="flex min-w-0 flex-col text-left">
                            <span>{t('cloudflare.title')}</span>
                            <span className="text-muted-foreground text-xs font-normal">
                                ({t('cloudflare.instanceCount', { count: accounts.length })})
                            </span>
                        </div>
                    </div>
                </AccordionTrigger>
                {hasAccounts && (
                    <AccordionContent className="bg-muted/40 border-t p-5">
                        <div className="space-y-2">
                            {accounts.map((account) => (
                                <CloudflareInstanceCard
                                    key={account.id}
                                    id={account.id}
                                    displayName={account.displayName}
                                />
                            ))}
                        </div>
                    </AccordionContent>
                )}
            </AccordionItem>
        </Accordion>
    );
}
