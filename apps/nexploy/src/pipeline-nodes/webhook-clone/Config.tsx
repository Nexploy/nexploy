'use client';

import { useNodeResource } from '@workspace/pipeline-ui/adapter';
import { useTranslations } from 'next-intl';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'next/navigation';
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
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Label } from '@workspace/ui/components/label';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import { useAction } from 'next-safe-action/hooks';
import { setupWebhookAction } from '@/actions/repository/pipeline/setupWebhook.action';
import { Can } from '@/components/permission/Can';
import { MERGE_REQUEST_ACTIONS, WEBHOOK_TRIGGER_EVENTS } from '@workspace/schemas-zod/pipeline/nodeConfigs.schema';

interface WebhookStatus {
    isConfigured: boolean;
}

type TriggerEvent = (typeof WEBHOOK_TRIGGER_EVENTS)[number];
type MergeRequestActionOption = (typeof MERGE_REQUEST_ACTIONS)[number];

const TRIGGER_EVENT_LABELS: Record<TriggerEvent, string> = {
    push: 'webhookEventPush',
    merge_request: 'webhookEventMergeRequest',
    tag: 'webhookEventTag',
};

const MERGE_REQUEST_ACTION_LABELS: Record<MergeRequestActionOption, string> = {
    opened: 'webhookMergeRequestActionOpened',
    updated: 'webhookMergeRequestActionUpdated',
    merged: 'webhookMergeRequestActionMerged',
    closed: 'webhookMergeRequestActionClosed',
};

export function WebhookCloneConfig() {
    const t = useTranslations('repository.pipeline.config');
    const form = useFormContext();
    const params = useParams<{ repositoryId: string }>();

    const { data: webhookStatus, mutate } = useNodeResource<WebhookStatus>(
        `/api/repositories/${params.repositoryId}/webhook`,
    );

    const { execute, isPending } = useAction(setupWebhookAction, {
        onSuccess: () => mutate(),
    });

    const selectedEvents: TriggerEvent[] = form.watch('triggerEvents') ?? ['push'];

    return (
        <div className="space-y-4">
            {webhookStatus?.isConfigured ? (
                <Alert className="border-green-500/30 bg-green-500/10 text-green-600 [&>svg]:text-green-600">
                    <CheckCircle />
                    <AlertDescription className="flex items-center justify-between gap-3 text-green-600">
                        <span>{t('webhookStatusConfigured')}</span>
                        <Can resource="repository" action="update">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                icon={RefreshCw}
                                isLoading={isPending}
                                disabled={isPending}
                                onClick={() =>
                                    execute({
                                        repositoryId: params.repositoryId,
                                        refresh: true,
                                    })
                                }
                                className="shrink-0 border-green-500/40 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                            >
                                {t('webhookResyncButton')}
                            </Button>
                        </Can>
                    </AlertDescription>
                </Alert>
            ) : (
                webhookStatus && (
                    <Alert className="border-yellow-500/30 bg-yellow-500/10 text-yellow-600 [&>svg]:text-yellow-600">
                        <AlertTriangle />
                        <AlertTitle className="text-yellow-600">{t('webhookStatusNotConfigured')}</AlertTitle>
                        <AlertDescription className="flex items-center justify-between gap-3">
                            <span className="text-yellow-600/80">{t('webhookStatusNotConfiguredDescription')}</span>
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
                name="triggerEvents"
                render={({ field }) => {
                    const value: TriggerEvent[] = field.value ?? ['push'];
                    const toggle = (event: TriggerEvent) => {
                        field.onChange(
                            value.includes(event) ? value.filter((selected) => selected !== event) : [...value, event],
                        );
                    };
                    return (
                        <FormItem>
                            <FormLabel>{t('webhookTriggerEvents')}</FormLabel>
                            <div className="flex flex-wrap gap-4">
                                {WEBHOOK_TRIGGER_EVENTS.map((event) => (
                                    <Label key={event} className="flex cursor-pointer items-center gap-1.5 text-xs">
                                        <Checkbox
                                            checked={value.includes(event)}
                                            onCheckedChange={() => toggle(event)}
                                        />
                                        {t(TRIGGER_EVENT_LABELS[event])}
                                    </Label>
                                ))}
                            </div>
                            <FormDescription className={'text-xs'}>
                                {t('webhookTriggerEventsDescription')}
                            </FormDescription>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    );
                }}
            />

            <FormField
                control={form.control}
                name="branchFilter"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('webhookBranchFilter')}</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value} placeholder={t('webhookBranchFilterPlaceholder')} />
                        </FormControl>
                        <FormDescription className={'text-xs'}>{t('webhookBranchFilterDescription')}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {selectedEvents.includes('merge_request') && (
                <FormField
                    control={form.control}
                    name="mergeRequestActions"
                    render={({ field }) => {
                        const value: MergeRequestActionOption[] = field.value ?? ['opened', 'updated'];
                        const toggle = (action: MergeRequestActionOption) => {
                            field.onChange(
                                value.includes(action)
                                    ? value.filter((selected) => selected !== action)
                                    : [...value, action],
                            );
                        };
                        return (
                            <FormItem>
                                <FormLabel>{t('webhookMergeRequestActions')}</FormLabel>
                                <div className="flex flex-wrap gap-4">
                                    {MERGE_REQUEST_ACTIONS.map((action) => (
                                        <Label
                                            key={action}
                                            className="flex cursor-pointer items-center gap-1.5 text-xs"
                                        >
                                            <Checkbox
                                                checked={value.includes(action)}
                                                onCheckedChange={() => toggle(action)}
                                            />
                                            {t(MERGE_REQUEST_ACTION_LABELS[action])}
                                        </Label>
                                    ))}
                                </div>
                                <FormDescription className={'text-xs'}>
                                    {t('webhookMergeRequestActionsDescription')}
                                </FormDescription>
                                <FormMessage className="text-xs" />
                            </FormItem>
                        );
                    }}
                />
            )}

            {selectedEvents.includes('tag') && (
                <FormField
                    control={form.control}
                    name="tagFilter"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('webhookTagFilter')}</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value ?? ''}
                                    placeholder={t('webhookTagFilterPlaceholder')}
                                />
                            </FormControl>
                            <FormDescription className={'text-xs'}>{t('webhookTagFilterDescription')}</FormDescription>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />
            )}

            <FormField
                control={form.control}
                name="submodules"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between gap-4">
                        <div className={'flex flex-col gap-1'}>
                            <FormLabel>{t('cloneSubmodules')}</FormLabel>
                            <FormDescription className={'text-xs'}>{t('cloneSubmodulesDescription')}</FormDescription>
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
