'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Download, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import type { ActivityExportFormat } from '@workspace/typescript-interface/activity';
import {
    ACTIVITY_EXPORT_ALL_VALUE,
    ACTIVITY_EXPORT_MAX_ROWS,
    activityExportFormSchema,
    type ActivityExportFormValues,
    type ActivityExportPeriod,
} from '@workspace/schemas-zod/admin/activity.schema';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { useActivityStore } from '@/stores/admin/useActivityStore';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

const EXPORT_ENDPOINT = '/api/admin/activity/export';

const FORMATS: ActivityExportFormat[] = ['csv', 'json', 'ndjson'];
const PERIODS: ActivityExportPeriod[] = ['24h', '7d', '30d', '90d', 'all', 'custom'];
const STATUSES = ['SUCCESS', 'FAILURE', 'DENIED'] as const;
const SOURCES = ['SERVER_ACTION', 'API_ROUTE', 'SYSTEM'] as const;

const DEFAULT_VALUES: ActivityExportFormValues = {
    format: 'csv',
    period: '30d',
    customFrom: '',
    customTo: '',
    status: ACTIVITY_EXPORT_ALL_VALUE,
    source: ACTIVITY_EXPORT_ALL_VALUE,
    applySearch: true,
};

function resolvePeriodStart(period: ActivityExportPeriod): string | null {
    switch (period) {
        case '24h':
            return dayjs().subtract(24, 'hour').toISOString();
        case '7d':
            return dayjs().subtract(7, 'day').toISOString();
        case '30d':
            return dayjs().subtract(30, 'day').toISOString();
        case '90d':
            return dayjs().subtract(90, 'day').toISOString();
        default:
            return null;
    }
}

export function ActivityExportForm() {
    const t = useTranslations('admin.activity');
    const tCommon = useTranslations('common');

    const search = useActivityStore((state) => state.search);
    const { closeDialog, onSuccess } = useConfirmationDialogStore();

    const form = useForm<ActivityExportFormValues>({
        resolver: zodResolver(activityExportFormSchema),
        defaultValues: DEFAULT_VALUES,
    });

    const period = form.watch('period');
    const customFrom = form.watch('customFrom');
    const customTo = form.watch('customTo');
    const isExporting = form.formState.isSubmitting;

    const trimmedSearch = search.trim();
    const hasSearch = trimmedSearch.length > 0;

    const buildParams = (values: ActivityExportFormValues) => {
        const params = new URLSearchParams();

        params.set('format', values.format);

        if (hasSearch && values.applySearch) params.set('search', trimmedSearch);
        if (values.status !== ACTIVITY_EXPORT_ALL_VALUE) params.set('status', values.status);
        if (values.source !== ACTIVITY_EXPORT_ALL_VALUE) params.set('source', values.source);

        if (values.period === 'custom') {
            params.set('from', dayjs(values.customFrom).startOf('day').toISOString());
            params.set('to', dayjs(values.customTo).endOf('day').toISOString());
        } else {
            const from = resolvePeriodStart(values.period);
            if (from) params.set('from', from);
        }

        return params;
    };

    const download = async (values: ActivityExportFormValues) => {
        try {
            const response = await fetch(`${EXPORT_ENDPOINT}?${buildParams(values).toString()}`);

            if (!response.ok) throw new Error(await response.text());

            const blob = await response.blob();
            const exported = Number(response.headers.get('X-Activity-Export-Count') ?? 0);
            const filename =
                response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ??
                `nexploy-activity.${values.format}`;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            toast.success(t('export.success', { count: exported }));

            if (onSuccess) onSuccess({ exported });
            else closeDialog();
        } catch {
            toast.error(t('export.error'));
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(download)} className="flex flex-col gap-4">
                <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                            <FormLabel>{t('export.format')}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {FORMATS.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {t(`export.formats.${value}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />

                <div className="flex items-start gap-2 rounded-lg border p-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-muted-foreground text-xs">{t('export.privacyNotice')}</p>
                </div>

                <FormField
                    control={form.control}
                    name="period"
                    render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                            <FormLabel>{t('export.period')}</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {PERIODS.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {t(`export.periods.${value}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />

                {period === 'custom' && (
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="customFrom"
                            render={({ field, fieldState }) => (
                                <FormItem className="flex flex-col gap-2">
                                    <FormLabel>{t('export.from')}</FormLabel>
                                    <FormControl>
                                        <Input type="date" max={customTo || undefined} {...field} />
                                    </FormControl>
                                    {fieldState.error?.message && (
                                        <p className="text-destructive text-sm">
                                            {t(`export.validation.${fieldState.error.message}`)}
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="customTo"
                            render={({ field, fieldState }) => (
                                <FormItem className="flex flex-col gap-2">
                                    <FormLabel>{t('export.to')}</FormLabel>
                                    <FormControl>
                                        <Input type="date" min={customFrom || undefined} {...field} />
                                    </FormControl>
                                    {fieldState.error?.message && (
                                        <p className="text-destructive text-sm">
                                            {t(`export.validation.${fieldState.error.message}`)}
                                        </p>
                                    )}
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-2">
                                <FormLabel>{t('columns.status')}</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={ACTIVITY_EXPORT_ALL_VALUE}>
                                            {t('export.allStatuses')}
                                        </SelectItem>
                                        {STATUSES.map((value) => (
                                            <SelectItem key={value} value={value}>
                                                {t(`status.${value}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                            <FormItem className="flex flex-col gap-2">
                                <FormLabel>{t('columns.source')}</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={ACTIVITY_EXPORT_ALL_VALUE}>
                                            {t('export.allSources')}
                                        </SelectItem>
                                        {SOURCES.map((value) => (
                                            <SelectItem key={value} value={value}>
                                                {t(`source.${value}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                </div>

                {hasSearch && (
                    <FormField
                        control={form.control}
                        name="applySearch"
                        render={({ field }) => (
                            <FormItem>
                                <Label className="flex items-start gap-2 rounded-lg border p-3 font-normal">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                        />
                                    </FormControl>
                                    <span className="flex flex-col gap-0.5">
                                        <span className="text-sm">{t('export.applySearch')}</span>
                                        <span className="break-all text-muted-foreground text-xs">{trimmedSearch}</span>
                                    </span>
                                </Label>
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex flex-col gap-1">
                    <p className="text-muted-foreground text-xs">
                        {t('export.limitNotice', { limit: ACTIVITY_EXPORT_MAX_ROWS })}
                    </p>
                    <p className="text-muted-foreground text-xs">{t('export.gdprNotice')}</p>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={closeDialog} disabled={isExporting}>
                        {tCommon('cancel')}
                    </Button>
                    <Button type="submit" isLoading={isExporting} disabled={isExporting}>
                        <Download className="size-4" />
                        {t('export.download')}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}
