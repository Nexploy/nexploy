'use client';

import { type DnsAccountInfo } from '@workspace/typescript-interface/dns/dns';
import { useTranslations } from 'next-intl';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@workspace/ui/components/accordion';
import { DnsAddButton } from '@/components/admin/integrations/DnsAddButton';
import { DnsAccountCard } from '@/components/admin/integrations/DnsAccountCard';
import { cn } from '@workspace/ui/lib/utils';
import { Globe, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface DnsAccordionSectionProps {
    accounts: DnsAccountInfo[];
}

export function DnsAccordionSection({ accounts }: DnsAccordionSectionProps) {
    const t = useTranslations('integrations');
    const hasAccounts = accounts.length > 0;

    return (
        <Accordion type="multiple" className="flex flex-col gap-3" defaultValue={['dns']}>
            <AccordionItem value="dns" className="rounded-lg border border-b! bg-card">
                <AccordionTrigger
                    position="left"
                    showChevron={hasAccounts}
                    classNameChevron="size-5"
                    className={cn('px-4 hover:no-underline', hasAccounts && 'cursor-pointer')}
                    headerChildren={
                        <div className="pr-4">
                            <DnsAddButton />
                        </div>
                    }
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                            <Globe className="size-5" />
                        </div>
                        <div className="flex min-w-0 flex-col text-left">
                            <div className="flex items-center gap-1.5">
                                <span>{t('dns.title')}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="size-3.5 cursor-help text-muted-foreground transition-colors hover:text-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-64 text-center text-xs">
                                        {t('dns.tooltip')}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <span className="text-muted-foreground text-xs">
                                ({t('dns.instanceCount', { count: accounts.length })})
                            </span>
                        </div>
                    </div>
                </AccordionTrigger>
                {hasAccounts && (
                    <AccordionContent className="border-t bg-muted/40 p-5">
                        <div className="space-y-2">
                            {accounts.map((account) => (
                                <DnsAccountCard
                                    key={account.id}
                                    id={account.id}
                                    displayName={account.displayName}
                                    provider={account.provider}
                                />
                            ))}
                        </div>
                    </AccordionContent>
                )}
            </AccordionItem>
        </Accordion>
    );
}
