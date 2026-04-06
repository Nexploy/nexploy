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
import { Switch } from '@workspace/ui/components/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@workspace/ui/components/form';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { createBackupScheduleSchema } from '@workspace/schemas-zod/aws/backupSchedule.schema';
import { createBackupScheduleAction } from '@/actions/aws/createSchedule.action';
import { deleteBackupScheduleAction } from '@/actions/aws/deleteSchedule.action';
import { AwsAccountInfo } from '@workspace/typescript-interface/aws/aws';
import { BackupSchedule } from 'generated/client';
import { DialogFooter } from '@workspace/ui/components/dialog';

const frequencyKeys = {
    HOURLY: 'frequencyHourly',
    DAILY: 'frequencyDaily',
    WEEKLY: 'frequencyWeekly',
    MONTHLY: 'frequencyMonthly',
} as const;

const DAY_OF_WEEK_KEYS = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
] as const;

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1);

function to24h(hour12: number, period: 'AM' | 'PM'): number {
    if (period === 'AM') return hour12 === 12 ? 0 : hour12;
    return hour12 === 12 ? 12 : hour12 + 12;
}

interface ScheduleTabProps {
    volumeName: string;
    awsAccounts: AwsAccountInfo[];
    initialSchedules: BackupSchedule[];
}

function formatScheduleDetail(
    s: BackupSchedule,
    t: ReturnType<typeof useTranslations<'admin'>>,
    is12h: boolean,
): string {
    const m = String(s.scheduledMinute).padStart(2, '0');
    const time = is12h
        ? `${s.scheduledHour % 12 || 12}:${m} ${s.scheduledHour < 12 ? 'AM' : 'PM'}`
        : `${String(s.scheduledHour).padStart(2, '0')}:${m}`;

    switch (s.frequency) {
        case 'HOURLY':
            return `:${m}`;
        case 'DAILY':
            return `${t('at')} ${time}`;
        case 'WEEKLY': {
            const dayKey = DAY_OF_WEEK_KEYS[(s.scheduledDay ?? 1) % 7] ?? 'monday';
            return `${t(dayKey)} ${t('at')} ${time}`;
        }
        case 'MONTHLY':
            return `${t('at')} ${time} (${t('scheduledDayOfMonth').toLowerCase()} ${s.scheduledDay ?? 1})`;
    }
}

export function ScheduleTab({ volumeName, awsAccounts, initialSchedules }: ScheduleTabProps) {
    const t = useTranslations('admin');
    const [schedules, setSchedules] = useState<BackupSchedule[]>(initialSchedules);
    const [is12h, setIs12h] = useState(false);

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
                    scheduledHour: 0,
                    scheduledMinute: 0,
                    scheduledDay: undefined,
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
                        scheduledHour: 0,
                        scheduledMinute: 0,
                        scheduledDay: undefined,
                    });
                },
                onError: ({ error }) => {
                    toast.error(error.serverError ?? t('scheduleCreateFailed'));
                },
            },
        },
    );

    const frequency = form.watch('frequency');
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
                                        <SelectGroup>
                                            <SelectLabel>{t('awsAccount')}</SelectLabel>
                                            {awsAccounts.map((a) => (
                                                <SelectItem key={a.id} value={a.id}>
                                                    {a.displayName} — {a.region}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
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
                                <div className="flex items-center justify-between">
                                    <FormLabel>{t('frequency')}</FormLabel>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-muted-foreground text-xs">12h</span>
                                        <Switch checked={is12h} onCheckedChange={setIs12h} />
                                    </div>
                                </div>
                                <Select
                                    value={field.value}
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        form.setValue(
                                            'scheduledDay',
                                            val === 'WEEKLY'
                                                ? 1
                                                : val === 'MONTHLY'
                                                  ? 1
                                                  : undefined,
                                        );
                                    }}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>{t('frequency')}</SelectLabel>
                                            <SelectItem value="HOURLY">
                                                {t('frequencyHourly')}
                                            </SelectItem>
                                            <SelectItem value="DAILY">
                                                {t('frequencyDaily')}
                                            </SelectItem>
                                            <SelectItem value="WEEKLY">
                                                {t('frequencyWeekly')}
                                            </SelectItem>
                                            <SelectItem value="MONTHLY">
                                                {t('frequencyMonthly')}
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {frequency === 'WEEKLY' && (
                        <FormField
                            control={form.control}
                            name="scheduledDay"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('scheduledDayOfWeek')}</FormLabel>
                                    <Select
                                        value={String(field.value ?? 1)}
                                        onValueChange={(v) => field.onChange(Number(v))}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>{t('scheduledDayOfWeek')}</SelectLabel>
                                                {DAY_OF_WEEK_KEYS.map((key, i) => (
                                                    <SelectItem key={i} value={String(i)}>
                                                        {t(key)}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {frequency === 'MONTHLY' && (
                        <FormField
                            control={form.control}
                            name="scheduledDay"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('scheduledDayOfMonth')}</FormLabel>
                                    <Select
                                        value={String(field.value ?? 1)}
                                        onValueChange={(v) => field.onChange(Number(v))}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>
                                                    {t('scheduledDayOfMonth')}
                                                </SelectLabel>
                                                {DAYS_OF_MONTH.map((d) => (
                                                    <SelectItem key={d} value={String(d)}>
                                                        {d}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {frequency === 'HOURLY' ? (
                        <FormField
                            control={form.control}
                            name="scheduledMinute"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('atMinute')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={59}
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="scheduledHour"
                                render={({ field }) => {
                                    const hour12 = (field.value ?? 0) % 12 || 12;
                                    const period = (field.value ?? 0) < 12 ? 'AM' : 'PM';
                                    return (
                                        <FormItem>
                                            <FormLabel>{t('scheduledHour')}</FormLabel>
                                            {is12h ? (
                                                <div className="flex gap-1.5">
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={12}
                                                            value={hour12}
                                                            className="w-16"
                                                            onChange={(e) => {
                                                                const h = Math.min(
                                                                    12,
                                                                    Math.max(
                                                                        1,
                                                                        Number(e.target.value) || 1,
                                                                    ),
                                                                );
                                                                field.onChange(to24h(h, period));
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <Select
                                                        value={period}
                                                        onValueChange={(v) =>
                                                            field.onChange(
                                                                to24h(hour12, v as 'AM' | 'PM'),
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectItem value="AM">
                                                                    AM
                                                                </SelectItem>
                                                                <SelectItem value="PM">
                                                                    PM
                                                                </SelectItem>
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            ) : (
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={23}
                                                        {...field}
                                                        onChange={(e) =>
                                                            field.onChange(Number(e.target.value))
                                                        }
                                                    />
                                                </FormControl>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />
                            <FormField
                                control={form.control}
                                name="scheduledMinute"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('scheduledMinute')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={59}
                                                {...field}
                                                onChange={(e) =>
                                                    field.onChange(Number(e.target.value))
                                                }
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
                            <Clock className="size-4" />
                            {t('createSchedule')}
                        </Button>
                    </DialogFooter>
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
                                    {t(frequencyKeys[s.frequency])} —{' '}
                                    {formatScheduleDetail(s, t, is12h)}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {t('lastRun')}:{' '}
                                    {s.lastRunAt
                                        ? dayjs(s.lastRunAt).format('DD/MM/YYYY HH:mm')
                                        : t('never')}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {t('nextRun')}: {dayjs(s.nextRunAt).format('DD/MM/YYYY HH:mm')}
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
