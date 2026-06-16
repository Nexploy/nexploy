'use client';

import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
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
import { to24h } from '@/utils/time';
import { createBackupScheduleAction } from '@/actions/aws/createSchedule.action';
import { AwsAccountInfo } from '@workspace/typescript-interface/aws/aws';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

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

interface ScheduleTabProps {
    volumeName: string;
    environmentId?: string;
    awsAccounts: AwsAccountInfo[];
}

export function ScheduleTab({ volumeName, awsAccounts }: ScheduleTabProps) {
    const t = useTranslations('admin');
    const locale = useLocale();

    const is12h =
        new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hour12 ?? false;

    const { closeDialog } = useConfirmationDialogStore();

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
                onSuccess: () => {
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
                    closeDialog();
                },
                onError: ({ error }) => {
                    toast.error(error.serverError ?? t('scheduleCreateFailed'));
                },
            },
        },
    );

    const frequency = form.watch('frequency');
    const isSubmitting = action.status === 'executing';

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
                                <FormLabel>{t('frequency')}</FormLabel>
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
                                            {...field}
                                            type="number"
                                            min={0}
                                            max={59}
                                            onChange={(e) =>
                                                field.onChange(
                                                    isNaN(e.target.valueAsNumber)
                                                        ? 0
                                                        : e.target.valueAsNumber,
                                                )
                                            }
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
                                                        <SelectTrigger>
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
                                                        {...field}
                                                        type="number"
                                                        min={0}
                                                        max={23}
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                isNaN(e.target.valueAsNumber)
                                                                    ? 0
                                                                    : e.target.valueAsNumber,
                                                            )
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
                                                {...field}
                                                type="number"
                                                min={0}
                                                max={59}
                                                onChange={(e) =>
                                                    field.onChange(
                                                        isNaN(e.target.valueAsNumber)
                                                            ? 0
                                                            : e.target.valueAsNumber,
                                                    )
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
                            {t('createSchedule')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </div>
    );
}
