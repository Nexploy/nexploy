'use client';

import { type BucketStorageAccountInfo } from '@/services/bucketStorage.service';
import { useTranslations } from 'next-intl';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@workspace/ui/components/accordion';
import { BucketStorageAddButton } from '@/components/admin/integrations/BucketStorageAddButton';
import { BucketStorageInstanceCard } from '@/components/admin/integrations/BucketStorageInstanceCard';
import { cn } from '@workspace/ui/lib/utils';
import { AwsAmazonSimpleStorageService } from '@thesvg/react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface BucketStorageAccordionSectionProps {
    bucketStorageAccounts: BucketStorageAccountInfo[];
}

export function BucketStorageAccordionSection({ bucketStorageAccounts }: BucketStorageAccordionSectionProps) {
    const t = useTranslations('integrations');
    const hasBucketStorageAccounts = bucketStorageAccounts.length > 0;

    return (
        <Accordion type="multiple" className="flex flex-col gap-3" defaultValue={['aws']}>
            <AccordionItem value="aws" className="rounded-lg border border-b! bg-card">
                <AccordionTrigger
                    position="left"
                    showChevron={hasBucketStorageAccounts}
                    classNameChevron="size-5"
                    className={cn('px-4 hover:no-underline', hasBucketStorageAccounts && 'cursor-pointer')}
                    headerChildren={
                        <div className="pr-4">
                            <BucketStorageAddButton />
                        </div>
                    }
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                            <AwsAmazonSimpleStorageService className="size-5" />
                        </div>
                        <div className="flex min-w-0 flex-col text-left">
                            <div className="flex items-center gap-1.5">
                                <span>{t('bucketStorage.title')}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="size-3.5 cursor-help text-muted-foreground transition-colors hover:text-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-64 text-center text-xs">
                                        {t('bucketStorage.tooltip')}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <span className="text-muted-foreground text-xs">
                                ({t('bucketStorage.instanceCount', { count: bucketStorageAccounts.length })})
                            </span>
                        </div>
                    </div>
                </AccordionTrigger>
                {hasBucketStorageAccounts && (
                    <AccordionContent className="border-t bg-muted/40 p-5">
                        <div className="space-y-2">
                            {bucketStorageAccounts.map((account) => (
                                <BucketStorageInstanceCard
                                    key={account.id}
                                    id={account.id}
                                    displayName={account.displayName}
                                    region={account.region}
                                    endpoint={account.endpoint}
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
