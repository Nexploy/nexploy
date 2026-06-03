'use client';

import { type AwsAccountInfo } from '@/services/aws.service';
import { useTranslations } from 'next-intl';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from '@workspace/ui/components/accordion';
import { AwsAddButton } from '@/components/admin/integrations/AwsAddButton';
import { AwsInstanceCard } from '@/components/admin/integrations/AwsInstanceCard';
import { cn } from '@workspace/ui/lib/utils';
import { Aws } from '@thesvg/react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface AwsAccordionSectionProps {
    awsAccounts: AwsAccountInfo[];
}

export function AwsAccordionSection({ awsAccounts }: AwsAccordionSectionProps) {
    const t = useTranslations('integrations');
    const hasAwsAccounts = awsAccounts.length > 0;

    return (
        <Accordion type="multiple" className="flex flex-col gap-3" defaultValue={['aws']}>
            <AccordionItem value="aws" className="bg-card rounded-lg border !border-b">
                <AccordionTrigger
                    position="left"
                    showChevron={hasAwsAccounts}
                    classNameChevron="size-5"
                    className={cn('px-4 hover:no-underline', hasAwsAccounts && 'cursor-pointer')}
                    headerChildren={
                        <div className="pr-4">
                            <AwsAddButton />
                        </div>
                    }
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                            <Aws className="size-5" />
                        </div>
                        <div className="flex min-w-0 flex-col text-left">
                            <div className="flex items-center gap-1.5">
                                <span>{t('aws.title')}</span>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="text-muted-foreground hover:text-foreground size-3.5 cursor-help transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-64 text-center text-xs">
                                            {t('aws.tooltip')}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <span className="text-muted-foreground text-xs font-normal">
                                ({t('aws.instanceCount', { count: awsAccounts.length })})
                            </span>
                        </div>
                    </div>
                </AccordionTrigger>
                {hasAwsAccounts && (
                    <AccordionContent className="bg-muted/40 border-t p-5">
                        <div className="space-y-2">
                            {awsAccounts.map((account) => (
                                <AwsInstanceCard
                                    key={account.id}
                                    id={account.id}
                                    displayName={account.displayName}
                                    region={account.region}
                                    maskedAccessKeyId={account.maskedAccessKeyId}
                                />
                            ))}
                        </div>
                    </AccordionContent>
                )}
            </AccordionItem>
        </Accordion>
    );
}
