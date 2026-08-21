'use client';

import { useTranslations } from 'next-intl';
import useSWR from 'swr';
import { toast } from 'sonner';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { HardDrive } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@workspace/ui/components/form';
import { Switch } from '@workspace/ui/components/switch';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Progress } from '@workspace/ui/components/progress';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { diskGuardSettingsSchema } from '@workspace/schemas-zod/docker/system/diskGuard.schema';
import type { DiskGuardStatus } from '@workspace/typescript-interface/docker/docker.disk';
import { updateDiskGuardSettingsAction } from '@/actions/admin/diskGuard/updateDiskGuardSettings.action';
import { formatBytes } from '@/utils/formatBytes';
import { fetcherApi } from '@/lib/api/fetcherApi';

interface DiskGuardCardSettings {
    enabled: boolean;
    warnPercent: number;
    blockPercent: number;
    minFreeMb: number;
}

const LEVEL_CLASSES: Record<DiskGuardStatus['level'], string> = {
    ok: 'text-muted-foreground',
    warn: 'text-amber-500',
    block: 'text-destructive',
};

export function DiskGuardCard({ settings }: { settings: DiskGuardCardSettings }) {
    const t = useTranslations('admin.settings');
    const { data: status } = useSWR<DiskGuardStatus>({ url: '/api/system/disk', disableToast: true }, fetcherApi, {
        refreshInterval: 30_000,
        revalidateOnFocus: false,
    });

    const { form, handleSubmitWithAction, action } = useHookFormAction(
        updateDiskGuardSettingsAction,
        zodResolver(diskGuardSettingsSchema),
        {
            formProps: {
                defaultValues: {
                    enabled: settings.enabled,
                    warnPercent: settings.warnPercent,
                    blockPercent: settings.blockPercent,
                    minFreeMb: settings.minFreeMb,
                },
            },
            actionProps: {
                onSuccess: ({ input }) => {
                    form.reset(input);
                    toast.success(t('diskGuardSaved'));
                },
            },
        },
    );

    return (
        <Card>
            <CardHeaderWithIcon icon={HardDrive} title={t('diskGuardTitle')} description={t('diskGuardDescription')} />
            <CardContent>
                <Form {...form}>
                    <form onSubmit={handleSubmitWithAction} className="flex flex-col gap-4">
                        {status && (
                            <div className="flex flex-col gap-2 rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-base">{t('diskGuardCurrentUsage')}</span>
                                    <span className={`font-medium text-sm ${LEVEL_CLASSES[status.level]}`}>
                                        {t(`diskGuardLevel.${status.level}`)}
                                    </span>
                                </div>
                                <Progress value={status.usedPercent} />
                                <span className="text-muted-foreground text-xs">
                                    {t('diskGuardUsageDetail', {
                                        percent: status.usedPercent,
                                        free: formatBytes(status.freeBytes),
                                        total: formatBytes(status.totalBytes),
                                    })}
                                </span>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="enabled"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex cursor-pointer items-center justify-between rounded-lg border p-4">
                                        <div className="flex flex-col">
                                            <span className="text-base">{t('diskGuardEnabled')}</span>
                                            <span className="text-muted-foreground text-xs">
                                                {t('diskGuardEnabledDescription')}
                                            </span>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormLabel>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="warnPercent"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                                    <div className="flex flex-col">
                                        <FormLabel className="text-base">{t('diskGuardWarnPercent')}</FormLabel>
                                        <span className="text-muted-foreground text-xs">
                                            {t('diskGuardWarnPercentDescription')}
                                        </span>
                                        <FormMessage />
                                    </div>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={99}
                                            className="w-24"
                                            value={field.value}
                                            onChange={(event) => field.onChange(Number(event.target.value))}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="blockPercent"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                                    <div className="flex flex-col">
                                        <FormLabel className="text-base">{t('diskGuardBlockPercent')}</FormLabel>
                                        <span className="text-muted-foreground text-xs">
                                            {t('diskGuardBlockPercentDescription')}
                                        </span>
                                        <FormMessage />
                                    </div>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={99}
                                            className="w-24"
                                            value={field.value}
                                            onChange={(event) => field.onChange(Number(event.target.value))}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="minFreeMb"
                            render={({ field }) => (
                                <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
                                    <div className="flex flex-col">
                                        <FormLabel className="text-base">{t('diskGuardMinFree')}</FormLabel>
                                        <span className="text-muted-foreground text-xs">
                                            {t('diskGuardMinFreeDescription')}
                                        </span>
                                        <FormMessage />
                                    </div>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            className="w-28"
                                            value={field.value}
                                            onChange={(event) => field.onChange(Number(event.target.value))}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

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
