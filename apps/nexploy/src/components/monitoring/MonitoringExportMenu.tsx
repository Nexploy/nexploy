'use client';

import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { useMonitoringStore } from '@/stores/monitoring/useMonitoringStore';
import { useContainersStatsStore } from '@/stores/docker/useContainersStatsStore';

export function MonitoringExportMenu() {
    const t = useTranslations('monitoring');

    const hostHistory = useMonitoringStore((state) => state.history);
    const exportMetrics = useMonitoringStore((state) => state.exportMetrics);
    const containerStats = useContainersStatsStore((state) => state.stats);
    const exportContainerStats = useContainersStatsStore((state) => state.exportStats);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button icon={Download}>{t('exportCsv')}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('export.label')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => exportMetrics()} disabled={hostHistory.length === 0}>
                    {t('export.host')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportContainerStats()} disabled={containerStats.length === 0}>
                    {t('export.containers')}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
