'use client';

import { useState } from 'react';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Clock, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { createBackupScheduleSchema } from '@workspace/schemas-zod/aws/backupSchedule.schema';
import { createBackupScheduleAction } from '@/actions/aws/createSchedule.action';
import { deleteBackupScheduleAction } from '@/actions/aws/deleteSchedule.action';
import { AwsAccountInfo } from '@workspace/typescript-interface/aws/aws';
import { BackupSchedule } from 'generated/client';

const frequencyKeys = {
    HOURLY: 'frequencyHourly',
    DAILY: 'frequencyDaily',
    WEEKLY: 'frequencyWeekly',
} as const;

interface ScheduleTabProps {
    volumeName: string;
    awsAccounts: AwsAccountInfo[];
    initialSchedules: BackupSchedule[];
}

export function ScheduleTab({ volumeName, awsAccounts, initialSchedules }: ScheduleTabProps) {
    const t = useTranslations('admin');
    const [schedules, setSchedules] = useState<BackupSchedule[]>(initialSchedules);

    const { form, action, handleSubmitWithAction } = useHookFormAction(
        createBackupScheduleAction,
        zodResolver(createBackupScheduleSchema),
        {
            formProps: {
                defaultValues: {
                    volumeName,
                    bucket: '',
                    awsAccountId: awsAccounts[0]?.id ?? '',
                    frequency: 'DAILY',
                },
            },
            actionProps: {
                onSuccess: ({ data }) => {
                    if (data) setSchedules((prev) => [...prev, data]);
                    toast.success(t('scheduleCreatedSuccess'));
                    form.reset({
                        volumeName,
                        bucket: '',
                        awsAccountId: form.getValues('awsAccountId'),
                        frequency: form.getValues('frequency'),
                    });
                },
                onError: ({ error }) => {
                    toast.error(error.serverError ?? t('scheduleCreateFailed'));
                },
            },
        },
    );

    const isSubmitting = action.status === 'executing';

    const handleDelete = async (id: string) => {
        const result = await deleteBackupScheduleAction({ id });
        if (result?.serverError) {
            toast.error(result.serverError);
            return;
        }
        toast.success(t('scheduleDeletedSuccess'));
        setSchedules((prev) => prev.filter((s) => s.id !== id));
    };

    return (
        <div className="space-y-4 pt-2">
            <Form {...form}>
                <form onSubmit={handleSubmitWithAction} className="space-y-3">
                    <FormField
                        control={form.control}
                        name="awsAccountId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('awsAccount')}</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t('selectAwsAccount')} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {awsAccounts.map((a) => (
                                            <SelectItem key={a.id} value={a.id}>
                                                {a.displayName} — {a.region}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="bucket"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('s3BucketName')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('s3BucketNamePlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('frequency')}</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="HOURLY">
                                            {t('frequencyHourly')}
                                        </SelectItem>
                                        <SelectItem value="DAILY">{t('frequencyDaily')}</SelectItem>
                                        <SelectItem value="WEEKLY">
                                            {t('frequencyWeekly')}
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                    >
                        <Clock className="size-4" />
                        {t('createSchedule')}
                    </Button>
                </form>
            </Form>

            {schedules.length > 0 && (
                <div className="space-y-2">
                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                        {t('activeSchedules')}
                    </p>
                    {schedules.map((s) => (
                        <div
                            key={s.id}
                            className="bg-muted/50 flex items-center justify-between rounded-md border px-3 py-2"
                        >
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium">{s.bucket}</span>
                                <span className="text-muted-foreground text-xs">
                                    {t(frequencyKeys[s.frequency])}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {t('lastRun')}:{' '}
                                    {s.lastRunAt
                                        ? dayjs(s.lastRunAt).format('DD/MM/YYYY HH:mm')
                                        : t('never')}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {t('nextRun')}:{' '}
                                    {dayjs(s.nextRunAt).format('DD/MM/YYYY HH:mm')}
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                                <Trash2 className="text-destructive size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
