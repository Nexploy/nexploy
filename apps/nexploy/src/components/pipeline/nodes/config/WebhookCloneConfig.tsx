'use client';

import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Switch } from '@workspace/ui/components/switch';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { useAction } from 'next-safe-action/hooks';
import { setupWebhookAction } from '@/actions/repository/pipeline/setupWebhook.action';
import { Can } from '@/components/permission/Can';

interface WebhookStatus {
    isConfigured: boolean;
}

export function WebhookCloneConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const params = useParams<{ repositoryId: string }>();

    const { data: webhookStatus, mutate } = useSWR<WebhookStatus>(
        { url: `/api/repositories/${params.repositoryId}/webhook` },
        fetcherApi,
    );

    const { execute, isPending } = useAction(setupWebhookAction, {
        onSuccess: () => mutate(),
    });

    return (
        <div className="space-y-4">
            {webhookStatus?.isConfigured ? (
                <Alert className="border-green-500/30 bg-green-500/10 text-green-600 [&>svg]:text-green-600">
                    <CheckCircle />
                    <AlertDescription className="text-green-600">
                        {t('webhookStatusConfigured')}
                    </AlertDescription>
                </Alert>
            ) : (
                webhookStatus && (
                    <Alert className="border-yellow-500/30 bg-yellow-500/10 text-yellow-600 [&>svg]:text-yellow-600">
                        <AlertTriangle />
                        <AlertTitle className="text-yellow-600">
                            {t('webhookStatusNotConfigured')}
                        </AlertTitle>
                        <AlertDescription className="flex items-center justify-between gap-3">
                            <span className="text-yellow-600/80">
                                {t('webhookStatusNotConfiguredDescription')}
                            </span>
                            <Can resource="repository" action="update">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    icon={RefreshCw}
                                    isLoading={isPending}
                                    disabled={isPending}
                                    onClick={() => execute({ repositoryId: params.repositoryId })}
                                    className="shrink-0 border-yellow-500/40 text-yellow-600 hover:bg-yellow-500/10 hover:text-yellow-700"
                                >
                                    {t('webhookSetupButton')}
                                </Button>
                            </Can>
                        </AlertDescription>
                    </Alert>
                )
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
                        <FormDescription className={'text-xs'}>
                            {t('webhookBranchFilterDescription')}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="submodules"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-4">
                        <div className={'flex flex-col gap-1'}>
                            <FormLabel>{t('cloneSubmodules')}</FormLabel>
                            <FormDescription className={'text-xs'}>
                                {t('cloneSubmodulesDescription')}
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                className={'cursor-pointer'}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
        </div>
    );
}
