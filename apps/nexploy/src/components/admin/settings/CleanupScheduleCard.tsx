'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { Button } from '@workspace/ui/components/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { updateCleanupSettingsSchema } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';
import { updateCleanupSettingsAction } from '@/actions/admin/cleanup/updateCleanupSettings.action';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(localizedFormat);

interface CleanupSettings {
    enabled: boolean;
    scheduledHour: number;
    cleanImages: boolean;
    cleanVolumes: boolean;
    cleanContainers: boolean;
    cleanBuild: boolean;
    lastRunAt: Date | string | null;
    lastReclaimed: number;
}

const TARGETS = ['cleanContainers', 'cleanImages', 'cleanVolumes', 'cleanBuild'] as const;

export function CleanupScheduleCard({ settings }: { settings: CleanupSettings }) {
    const t = useTranslations('admin.settings');
    const locale = useLocale();

    useEffect(() => {
        import(`dayjs/locale/${locale}`);
    }, [locale]);

    const formatHour = (hour: number) => dayjs().hour(hour).minute(0).locale(locale).format('LT');

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateCleanupSettingsAction,
        zodResolver(updateCleanupSettingsSchema),
        {
            formProps: {
                defaultValues: {
                    enabled: settings.enabled,
                    scheduledHour: settings.scheduledHour,
                    cleanImages: settings.cleanImages,
                    cleanVolumes: settings.cleanVolumes,
                    cleanContainers: settings.cleanContainers,
                    cleanBuild: settings.cleanBuild,
                },
            },
            actionProps: {
                onSuccess: ({ input }) => {
                    form.reset(input);
                    toast.success(t('scheduleSaved'));
                },
                onError: () => toast.error(t('saveFailed')),
            },
        },
    );

    return (
        <Card>
            <CardHeaderWithIcon
                icon={CalendarClock}
                title={t('scheduleTitle')}
                description={t('scheduleDescription')}
            />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
                        <FormField
                            control={form.control}
                            name="enabled"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                        <div className="flex flex-col">
                                            <span className="text-base">
                                                {t('scheduleEnabled')}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                {t('scheduleEnabledDescription')}
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormLabel>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="scheduledHour"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex flex-col">
                                        <FormLabel className="text-base">
                                            {t('scheduledHour')}
                                        </FormLabel>
                                        <span className="text-muted-foreground text-xs">
                                            {t('scheduledHourDescription')}
                                        </span>
                                    </div>
                                    <Select
                                        value={`${field.value}`}
                                        onValueChange={(v) => field.onChange(Number(v))}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Array.from({ length: 24 }, (_, h) => (
                                                <SelectItem key={h} value={`${h}`}>
                                                    {formatHour(h)} UTC
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />

                        <div className="rounded-lg border p-4">
                            <p className="text-base">{t('cleanupTargets')}</p>
                            <p className="text-muted-foreground mb-3 text-xs">
                                {t('cleanupTargetsDescription')}
                            </p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {TARGETS.map((name) => (
                                    <FormField
                                        key={name}
                                        control={form.control}
                                        name={name}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex cursor-pointer items-center gap-2">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                    <span className="text-sm">{t(name)}</span>
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                        {settings.lastRunAt && (
                            <p className="text-muted-foreground text-xs">
                                {t('lastRun', {
                                    date: dayjs(settings.lastRunAt).format('DD/MM/YYYY HH:mm'),
                                })}
                            </p>
                        )}
                        <Button
                            type="submit"
                            disabled={action.isPending || !form.formState.isDirty}
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
