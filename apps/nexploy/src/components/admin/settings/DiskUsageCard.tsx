'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAction } from 'next-safe-action/hooks';
import { Box, Container, Hammer, HardDrive, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { formatBytes } from '@/utils/formatBytes';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { runCleanupAction } from '@/actions/admin/cleanup/runCleanup.action';
import type { CleanupResult, DiskUsage, } from '@workspace/typescript-interface/docker/docker.system';
import type { CleanupTarget } from '@workspace/schemas-zod/docker/system/systemCleanup.schema';
import { fetcherApi } from '@/lib/api/fetcherApi.ts';
import useSWR from 'swr';

const ICONS = {
    images: Box,
    containers: Container,
    volumes: HardDrive,
    build: Hammer,
} as const;

export function DiskUsageCard() {
    const t = useTranslations('admin.settings');
    const tCommon = useTranslations('common');
    const [pendingTarget, setPendingTarget] = useState<CleanupTarget | null>(null);

    const {
        data: usage,
        isLoading,
        isValidating: refreshing,
        mutate,
    } = useSWR<DiskUsage | null>({ url: '/api/system/disk-usage', disableToast: true }, fetcherApi);

    const { executeAsync } = useAction(runCleanupAction);
    const { openAlertDialog } = useAlertConfirmationDialogStore();

    const refresh = () => mutate();

    const runClean = async (target: CleanupTarget) => {
        setPendingTarget(target);
        try {
            const result = await executeAsync({ target });
            const reclaimed = (result?.data as CleanupResult | undefined)?.reclaimedSpace ?? 0;
            toast.success(t('cleanupDone', { space: formatBytes(reclaimed) }));
            await refresh();
        } catch {
            toast.error(t('cleanupFailed'));
        } finally {
            setPendingTarget(null);
        }
    };

    const handleClean = (target: CleanupTarget) => {
        openAlertDialog({
            title: target === 'all' ? t('cleanAll') : t('clean'),
            description:
                target === 'all'
                    ? t('confirmCleanAll')
                    : t('confirmClean', { target: t(`target.${target}`) }),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('clean'),
            props: { className: 'sm:max-w-md' },
            onAction: () => runClean(target),
        });
    };

    const rows: { key: CleanupTarget; total: number; reclaimable: number }[] = usage
        ? [
              { key: 'images', total: usage.images.size, reclaimable: usage.images.reclaimable },
              {
                  key: 'containers',
                  total: usage.containers.size,
                  reclaimable: usage.containers.reclaimable,
              },
              { key: 'volumes', total: usage.volumes.size, reclaimable: usage.volumes.reclaimable },
              {
                  key: 'build',
                  total: usage.buildCache.size,
                  reclaimable: usage.buildCache.reclaimable,
              },
          ]
        : [];

    return (
        <Card>
            <CardHeaderWithIcon
                icon={HardDrive}
                title={t('diskUsageTitle')}
                description={t('diskUsageDescription')}
            >
                <Button
                    variant="outline"
                    size="sm"
                    onClick={refresh}
                    disabled={refreshing}
                    className="ml-auto"
                >
                    <RefreshCw className={refreshing ? 'animate-spin' : ''} />
                    {t('refresh')}
                </Button>
            </CardHeaderWithIcon>
            <CardContent className="flex flex-col gap-4">
                {isLoading ? (
                    <>
                        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-4">
                            <div className="flex flex-col gap-2">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-7 w-32" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                            <Skeleton className="h-9 w-24" />
                        </div>

                        <div className="overflow-hidden rounded-md border">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-between gap-3 px-4 py-3 ${
                                        i < 3 ? 'border-b' : ''
                                    }`}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Skeleton className="size-8 shrink-0 rounded-md" />
                                        <div className="flex flex-col gap-2">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            ))}
                        </div>
                    </>
                ) : !usage ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">
                        {t('diskUsageUnavailable')}
                    </p>
                ) : (
                    <>
                        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-4">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">
                                    {t('totalReclaimable')}
                                </span>
                                <span className="text-2xl font-semibold">
                                    {formatBytes(usage.totalReclaimable)}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {t('ofTotal', { total: formatBytes(usage.totalSize) })}
                                </span>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={() => handleClean('all')}
                                disabled={pendingTarget !== null}
                            >
                                <Trash2
                                    className={pendingTarget === 'all' ? 'animate-pulse' : ''}
                                />
                                {t('cleanAll')}
                            </Button>
                        </div>

                        <div className="overflow-hidden rounded-md border">
                            {rows.map((row, i) => {
                                const Icon = ICONS[row.key as keyof typeof ICONS];
                                return (
                                    <div
                                        key={row.key}
                                        className={`flex items-center justify-between gap-3 px-4 py-3 ${
                                            i < rows.length - 1 ? 'border-b' : ''
                                        }`}
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-md">
                                                <Icon className="text-primary size-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {t(`target.${row.key}`)}
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    {t('reclaimableOf', {
                                                        reclaimable: formatBytes(row.reclaimable),
                                                        total: formatBytes(row.total),
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleClean(row.key)}
                                            disabled={pendingTarget !== null}
                                        >
                                            <Trash2
                                                className={
                                                    pendingTarget === row.key ? 'animate-pulse' : ''
                                                }
                                            />
                                            {t('clean')}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
