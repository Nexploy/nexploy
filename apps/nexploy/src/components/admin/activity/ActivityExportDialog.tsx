'use client';

import { useMemo, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import type { ActivityExportFormat } from '@workspace/typescript-interface/activity';
import { ACTIVITY_EXPORT_MAX_ROWS } from '@workspace/schemas-zod/admin/activity.schema';
import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@workspace/ui/components/select';
import { useActivityStore } from '@/stores/admin/useActivityStore';

const EXPORT_ENDPOINT = '/api/admin/activity/export';

const FORMATS: ActivityExportFormat[] = ['csv', 'json', 'ndjson'];
const PERIODS = ['24h', '7d', '30d', '90d', 'all', 'custom'] as const;
const STATUSES = ['SUCCESS', 'FAILURE', 'DENIED'] as const;
const SOURCES = ['SERVER_ACTION', 'API_ROUTE'] as const;

const ALL_VALUE = 'all';

type ActivityExportPeriod = (typeof PERIODS)[number];

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

export function ActivityExportDialog() {
    const t = useTranslations('admin.activity');
    const tCommon = useTranslations('common');

    const search = useActivityStore((state) => state.search);

    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [format, setFormat] = useState<ActivityExportFormat>('csv');
    const [period, setPeriod] = useState<ActivityExportPeriod>('30d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const [status, setStatus] = useState<string>(ALL_VALUE);
    const [source, setSource] = useState<string>(ALL_VALUE);
    const [applySearch, setApplySearch] = useState(true);

    const trimmedSearch = search.trim();
    const hasSearch = trimmedSearch.length > 0;

    const filters = useMemo(() => {
        const params = new URLSearchParams();

        if (hasSearch && applySearch) params.set('search', trimmedSearch);
        if (status !== ALL_VALUE) params.set('status', status);
        if (source !== ALL_VALUE) params.set('source', source);

        if (period === 'custom') {
            if (customFrom) params.set('from', dayjs(customFrom).startOf('day').toISOString());
            if (customTo) params.set('to', dayjs(customTo).endOf('day').toISOString());
        } else {
            const from = resolvePeriodStart(period);
            if (from) params.set('from', from);
        }

        params.sort();

        return params.toString();
    }, [applySearch, customFrom, customTo, hasSearch, period, source, status, trimmedSearch]);

    const download = async () => {
        setIsExporting(true);

        try {
            const params = new URLSearchParams(filters);
            params.set('format', format);

            const response = await fetch(`${EXPORT_ENDPOINT}?${params.toString()}`);

            if (!response.ok) throw new Error(await response.text());

            const blob = await response.blob();
            const exported = Number(response.headers.get('X-Activity-Export-Count') ?? 0);
            const filename =
                response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ??
                `nexploy-activity.${format}`;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            toast.success(t('export.success', { count: exported }));
            setIsOpen(false);
        } catch {
            toast.error(t('export.error'));
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="mt-5">
                    <Download className="size-4" />
                    {t('export.trigger')}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t('export.title')}</DialogTitle>
                    <DialogDescription>{t('export.description')}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 px-6">
                    <div className="flex flex-col gap-2">
                        <Label>{t('export.format')}</Label>
                        <Select value={format} onValueChange={(value) => setFormat(value as ActivityExportFormat)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FORMATS.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {t(`export.formats.${value}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-start gap-2 rounded-lg border p-3">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                        <p className="text-muted-foreground text-xs">{t('export.privacyNotice')}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>{t('export.period')}</Label>
                        <Select value={period} onValueChange={(value) => setPeriod(value as ActivityExportPeriod)}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PERIODS.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {t(`export.periods.${value}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {period === 'custom' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="activity-export-from">{t('export.from')}</Label>
                                <Input
                                    id="activity-export-from"
                                    type="date"
                                    value={customFrom}
                                    max={customTo || undefined}
                                    onChange={(event) => setCustomFrom(event.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="activity-export-to">{t('export.to')}</Label>
                                <Input
                                    id="activity-export-to"
                                    type="date"
                                    value={customTo}
                                    min={customFrom || undefined}
                                    onChange={(event) => setCustomTo(event.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                            <Label>{t('columns.status')}</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_VALUE}>{t('export.allStatuses')}</SelectItem>
                                    {STATUSES.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {t(`status.${value}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>{t('columns.source')}</Label>
                            <Select value={source} onValueChange={setSource}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_VALUE}>{t('export.allSources')}</SelectItem>
                                    {SOURCES.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {t(`source.${value}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {hasSearch && (
                        <Label className="flex items-start gap-2 rounded-lg border p-3 font-normal">
                            <Checkbox
                                checked={applySearch}
                                onCheckedChange={(checked) => setApplySearch(checked === true)}
                            />
                            <span className="flex flex-col gap-0.5">
                                <span className="text-sm">{t('export.applySearch')}</span>
                                <span className="break-all text-muted-foreground text-xs">{trimmedSearch}</span>
                            </span>
                        </Label>
                    )}

                    <div className="flex flex-col gap-1">
                        <p className="text-muted-foreground text-xs">
                            {t('export.limitNotice', { limit: ACTIVITY_EXPORT_MAX_ROWS })}
                        </p>
                        <p className="text-muted-foreground text-xs">{t('export.gdprNotice')}</p>
                    </div>
                </div>

                <DialogFooter className="px-6 pb-6">
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
                        {tCommon('cancel')}
                    </Button>
                    <Button onClick={download} isLoading={isExporting} disabled={isExporting}>
                        <Download className="size-4" />
                        {t('export.download')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
