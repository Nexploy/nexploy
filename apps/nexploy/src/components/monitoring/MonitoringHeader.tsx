'use client';

import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import { Activity } from 'lucide-react';
import { useMonitoringStore } from '@/stores/monitoring/useMonitoringStore';
import { MonitoringRefreshRateSelect } from '@/components/monitoring/MonitoringRefreshRateSelect';
import { MonitoringExportMenu } from '@/components/monitoring/MonitoringExportMenu';

export function MonitoringHeader() {
    const t = useTranslations('monitoring');

    const lastUpdate = useMonitoringStore((state) => state.lastUpdate);

    return (
        <div className="flex flex-wrap justify-between gap-3 px-5">
            <div className="flex gap-3">
                <div className="mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Activity className="size-7 text-primary" />
                </div>
                <div className="mt-3.5 flex flex-col">
                    <h1 className="break-all font-semibold text-3xl tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground text-sm">
                        {t('description')}
                        {lastUpdate
                            ? ` • ${t('lastUpdate', {
                                  time: dayjs(lastUpdate).format('HH:mm:ss'),
                              })}`
                            : ''}
                    </p>
                </div>
            </div>
            <div className="mt-5 flex gap-3">
                <MonitoringRefreshRateSelect />
                <MonitoringExportMenu />
            </div>
        </div>
    );
}
