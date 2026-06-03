'use client';

import { type CloudflareAccountInfo } from '@workspace/typescript-interface/cloudflare/cloudflare';
import { useTranslations } from 'next-intl';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from '@workspace/ui/components/accordion';
import { CloudflareAddButton } from '@/components/admin/integrations/CloudflareAddButton';
import { CloudflareInstanceCard } from '@/components/admin/integrations/CloudflareInstanceCard';
import { cn } from '@workspace/ui/lib/utils';
import { Cloudflare } from '@thesvg/react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface CloudflareAccordionSectionProps {
    accounts: CloudflareAccountInfo[];
}

export function CloudflareAccordionSection({ accounts }: CloudflareAccordionSectionProps) {
    const t = useTranslations('integrations');
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
                            <Cloudflare className="size-5" />
                        </div>
                        <div className="flex min-w-0 flex-col text-left">
                            <div className="flex items-center gap-1.5">
                                <span>{t('cloudflare.title')}</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="text-muted-foreground hover:text-foreground size-3.5 cursor-help transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-64 text-center text-xs">
                                            {t('cloudflare.tooltip')}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
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
