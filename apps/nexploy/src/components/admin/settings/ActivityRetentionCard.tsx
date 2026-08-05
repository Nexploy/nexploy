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
import { useActivityStore } from '@/stores/admin/useActivityStore';

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

    const purge = async () => {
        const result = await purgeActivityLogsAction({});

        if (result?.serverError) {
            toast.error(result.serverError);
            return;
        }

        if (result?.data?.purged) {
            useActivityStore.getState().applyPurge(result.data.purgedBefore);
        }

        setLastPurgeAt(dayjs().toISOString());
        toast.success(t('retentionPurged', { count: result?.data?.purged ?? 0 }));
    };

    const handlePurge = () => {
        openAlertDialog({
            title: t('retentionPurgeConfirmTitle'),
            description: t('retentionPurgeConfirmDescription'),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('retentionPurgeConfirmAction'),
            onAction: purge,
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
                                                onChange={(event) => field.onChange(Number(event.target.value))}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex flex-col">
                                <span className="text-base">{t('retentionPurgeTitle')}</span>
                                <span className="text-muted-foreground text-xs">
                                    {lastPurgeAt
                                        ? t('retentionLastPurge', {
                                              date: dayjs(lastPurgeAt).format('DD/MM/YYYY HH:mm'),
                                          })
                                        : t('retentionPurgeNowDescription')}
                                </span>
                            </div>
                            <Button type="button" variant="destructive" onClick={handlePurge}>
                                <Trash2 className="size-4" />
                                {t('retentionPurgeNow')}
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
