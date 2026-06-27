'use client';

import { type S3AccountInfo } from '@/services/s3.service';
import { useTranslations } from 'next-intl';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { S3AddButton } from '@/components/admin/integrations/S3AddButton';
import { S3InstanceCard } from '@/components/admin/integrations/S3InstanceCard';
import { cn } from '@workspace/ui/lib/utils';
import { AwsAmazonSimpleStorageService } from '@thesvg/react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface S3AccordionSectionProps {
    s3Accounts: S3AccountInfo[];
}

export function S3AccordionSection({ s3Accounts }: S3AccordionSectionProps) {
    const t = useTranslations('integrations');
    const hasS3Accounts = s3Accounts.length > 0;

    return (
        <Accordion type="multiple" className="flex flex-col gap-3" defaultValue={['aws']}>
            <AccordionItem value="aws" className="bg-card rounded-lg border !border-b">
                <AccordionTrigger
                    position="left"
                    showChevron={hasS3Accounts}
                    classNameChevron="size-5"
                    className={cn('px-4 hover:no-underline', hasS3Accounts && 'cursor-pointer')}
                    headerChildren={
                        <div className="pr-4">
                            <S3AddButton />
                        </div>
                    }
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                            <AwsAmazonSimpleStorageService className="size-5" />
                        </div>
                        <div className="flex min-w-0 flex-col text-left">
                            <div className="flex items-center gap-1.5">
                                <span>{t('s3.title')}</span>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="text-muted-foreground hover:text-foreground size-3.5 cursor-help transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-64 text-center text-xs">
                                        {t('s3.tooltip')}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <span className="text-muted-foreground text-xs">
                                ({t('s3.instanceCount', { count: s3Accounts.length })})
                            </span>
                        </div>
                    </div>
                </AccordionTrigger>
                {hasS3Accounts && (
                    <AccordionContent className="bg-muted/40 border-t p-5">
                        <div className="space-y-2">
                            {s3Accounts.map((account) => (
                                <S3InstanceCard
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
