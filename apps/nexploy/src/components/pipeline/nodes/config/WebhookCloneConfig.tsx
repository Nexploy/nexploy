'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { CheckCircle } from 'lucide-react';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { fetcherApi } from '@/lib/api/fetcherApi';

interface WebhookStatus {
    isConfigured: boolean;
}

export function WebhookCloneConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const params = useParams<{ repositoryId: string }>();

    const { data: webhookStatus } = useSWR<WebhookStatus>(
        { url: `/api/repositories/${params.repositoryId}/webhook` },
        fetcherApi,
    );

    return (
        <div className="space-y-4">
            {webhookStatus?.isConfigured && (
                <div className="flex items-start gap-2 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-600">
                    <CheckCircle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{t('webhookStatusConfigured')}</span>
                </div>
            )}

            <FormField
                control={form.control}
                name="branchFilter"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('webhookBranchFilter')}</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value}
                                placeholder={t('webhookBranchFilterPlaceholder')}
                            />
                        </FormControl>
                        <FormDescription>{t('webhookBranchFilterDescription')}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
}
