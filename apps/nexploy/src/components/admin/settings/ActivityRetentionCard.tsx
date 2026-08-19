'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { History, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { activityRetentionSchema } from '@workspace/schemas-zod/admin/activity.schema';
import type { ActivitySettings } from '@workspace/typescript-interface/activity';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { purgeActivityLogsAction } from '@/actions/admin/activity/purgeActivityLogs.action';
import { updateActivityRetentionAction } from '@/actions/admin/activity/updateActivityRetention.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

export function ActivityRetentionCard({ settings }: { settings: ActivitySettings }) {
    const t = useTranslations('admin.settings');
    const tCommon = useTranslations('common');
    const [lastPurgeAt, setLastPurgeAt] = useState(settings.lastPurgeAt);
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateActivityRetentionAction,
        zodResolver(activityRetentionSchema),
        {
            formProps: {
                defaultValues: {
                    retentionDays: settings.retentionDays,
                },
            },
            actionProps: {
                onSuccess: ({ input }) => {
                    form.reset(input);
                    toast.success(t('retentionSaved'));
                },
            },
        },
    );

    const purgeAll = async () => {
        const result = await purgeActivityLogsAction({ scope: 'all' });

        if (result?.serverError) {
            toast.error(result.serverError);
            return;
        }

        const purged = result?.data?.purged ?? 0;
        setLastPurgeAt(dayjs().toISOString());

        if (purged === 0) {
            toast.info(t('retentionPurgedNone'));
            return;
        }

        toast.success(t('retentionPurged', { count: purged }));
    };

    const handlePurgeAll = () => {
        openAlertDialog({
            title: t('retentionPurgeAllConfirmTitle'),
            description: t('retentionPurgeAllConfirmDescription'),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('retentionPurgeAllConfirmAction'),
            onAction: purgeAll,
        });
    };

    return (
        <Card>
            <CardHeaderWithIcon icon={History} title={t('retentionTitle')} description={t('retentionDescription')} />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
                        <FormField
                            control={form.control}
                            name="retentionDays"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex flex-col">
                                        <FormLabel className="text-base">{t('retentionDays')}</FormLabel>
                                        <span className="text-muted-foreground text-xs">
                                            {t('retentionDaysDescription')}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                className="w-28"
                                                {...field}
                                                onChange={(event) =>
                                                    field.onChange(
                                                        event.target.value === '' ? '' : Number(event.target.value),
                                                    )
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-between rounded-lg border border-destructive/40 p-4">
                            <div className="flex flex-col">
                                <span className="text-base">{t('retentionPurgeAllTitle')}</span>
                                <span className="text-muted-foreground text-xs">
                                    {t('retentionPurgeAllDescription')}
                                </span>
                                {lastPurgeAt && (
                                    <span className="text-muted-foreground text-xs">
                                        {t('retentionLastPurge', {
                                            date: dayjs(lastPurgeAt).format('DD/MM/YYYY HH:mm'),
                                        })}
                                    </span>
                                )}
                            </div>
                            <Button type="button" variant="destructive" onClick={handlePurgeAll}>
                                <Trash2 className="size-4" />
                                {t('retentionPurgeAll')}
                            </Button>
                        </div>

                        <Button
                            type="submit"
                            disabled={action.isPending || !form.formState.isDirty}
                            isLoading={action.isPending}
                            className="self-end"
                        >
                            {t('save')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
