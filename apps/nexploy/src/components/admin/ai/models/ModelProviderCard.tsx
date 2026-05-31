'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Separator } from '@workspace/ui/components/separator';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import { cn } from '@workspace/ui/lib/utils';
import { addAiConfigAction } from '@/actions/admin/ai/addAiConfig.action.ts';
import { deleteAiConfigAction } from '@/actions/admin/ai/deleteAiConfig.action';
import { addProviderApiKeySchema } from '@workspace/schemas-zod/ai/aiConfig.schema';
import type { ProviderCardConfig } from '@workspace/typescript-interface/ai/aiConfig';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

export function ModelProviderCard({
    provider,
    label,
    color,
    icon,
    hasKey,
    keyUrl,
}: ProviderCardConfig) {
    const t = useTranslations('ai.admin.models');
    const tCommon = useTranslations('common');
    const router = useRouter();

    const [editing, setEditing] = useState(!hasKey);

    const { form, handleSubmitWithAction } = useHookFormAction(
        addAiConfigAction,
        zodResolver(addProviderApiKeySchema),
        {
            formProps: {
                defaultValues: {
                    provider,
                    apiKey: '',
                },
                mode: 'onSubmit',
                reValidateMode: 'onSubmit',
            },
            actionProps: {
                onSuccess: () => {
                    setEditing(false);
                    toast.success(t('saveSuccess'));
                    router.refresh();
                },
                onError: () => toast.error(t('saveFailed')),
            },
        },
    );

    const { executeAsync: deleteKey, isPending: isDeleting } = useAction(deleteAiConfigAction, {
        onError: () => toast.error(t('deleteFailed')),
    });

    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    function handleDelete() {
        openAlertDialog({
            title: t('deleteConfirmTitle'),
            description: t('deleteConfirmDescription', { provider: label }),
            actionLabel: t('deleteConfirmAction'),
            onAction: async () => {
                await deleteKey({ provider });
                toast.success(t('deleteSuccess'));
                router.refresh();
            },
        });
    }

    function handleChangeClick() {
        form.reset({ provider, apiKey: '' });
        form.clearErrors();
        setEditing(true);
    }

    function handleCancel() {
        form.reset({ provider, apiKey: '' });
        form.clearErrors();
        setEditing(false);
    }

    return (
        <Form {...form}>
            <form onSubmit={handleSubmitWithAction} className="bg-card rounded-xl border shadow-sm">
                <div className="flex items-center justify-between gap-2 p-4">
                    <div className={'flex items-center gap-2'}>
                        <div
                            className={cn(
                                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                color,
                            )}
                        >
                            {icon}
                        </div>
                        <div className="flex gap-2">
                            <span className="leading-tight font-semibold">{label}</span>
                            {hasKey && (
                                <Status status={'online'}>
                                    <StatusIndicator />
                                    <StatusLabel>{t('statusConfigured')}</StatusLabel>
                                </Status>
                            )}
                        </div>
                    </div>
                    <Link href={keyUrl} className="min-w-0 overflow-hidden">
                        <Button
                            variant="ghost"
                            type={'button'}
                            size="sm"
                            className="w-full overflow-hidden"
                        >
                            <ExternalLink className="shrink-0" />
                            <span className="truncate">{t('getApiKey')}</span>
                        </Button>
                    </Link>
                </div>
                <Separator />
                <div className="bg-muted/40 flex flex-col gap-2 p-4">
                    <FormLabel>{t('apiKey')}</FormLabel>
                    <div className="flex flex-1 gap-2">
                        <FormField
                            control={form.control}
                            name="apiKey"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        {editing ? (
                                            <Input
                                                {...field}
                                                value={field.value ?? ''}
                                                type="password"
                                                placeholder={t('apiKeyPlaceholder')}
                                                disabled={form.formState.isSubmitting}
                                                autoFocus
                                            />
                                        ) : (
                                            <Input
                                                value="••••••••••••••••••••••••"
                                                type="text"
                                                readOnly
                                                disabled
                                            />
                                        )}
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {editing ? (
                            <div className="flex gap-2">
                                {hasKey && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancel}
                                        disabled={form.formState.isSubmitting}
                                    >
                                        {tCommon('cancel')}
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    isLoading={form.formState.isSubmitting}
                                    disabled={
                                        form.formState.isSubmitting || !form.formState.isDirty
                                    }
                                >
                                    {tCommon('save')}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={handleChangeClick}>
                                    {t('changeKey')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructiveOutline"
                                    size="icon"
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="size-4" />
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </form>
        </Form>
    );
}
