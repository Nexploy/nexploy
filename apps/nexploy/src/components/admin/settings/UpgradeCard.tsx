'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useAction } from 'next-safe-action/hooks';
import { useTranslations } from 'next-intl';
import { ArrowUpCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { triggerUpgradeAction } from '@/actions/admin/triggerUpgrade.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

interface VersionInfo {
    current: string;
    latest: string;
    updateAvailable: boolean;
}

interface ActiveBuildInfo {
    id: string;
    repositoryName: string;
    status: string;
}

export function UpgradeCard() {
    const t = useTranslations('admin.settings');
    const tCommon = useTranslations('common');
    const [isRestarting, setIsRestarting] = useState(false);

    const { data, isLoading, isValidating, mutate } = useSWR<VersionInfo | null>(
        { url: '/api/admin/version', disableToast: true },
        fetcherApi,
    );

    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const { execute: upgrade, isPending: upgrading } = useAction(triggerUpgradeAction, {
        onSuccess: () => setIsRestarting(true),
        onError: () => setIsRestarting(true),
    });

    const handleUpgrade = async (version: string) => {
        const activeBuilds = await fetcherApi<{ builds: ActiveBuildInfo[] }>({
            url: '/api/admin/active-builds',
            disableToast: true,
        }).catch(() => ({ builds: [] }));

        openDialog({
            title: t('upgradeConfirmTitle'),
            description: t('upgradeWarning'),
            content: (
                <>
                    {activeBuilds.builds.length > 0 && (
                        <div className="border-destructive/30 bg-destructive/10 mb-4 rounded-lg border p-3 text-sm">
                            <p className="text-destructive font-medium">
                                {t('upgradeActiveBuildsWarning')}
                            </p>
                            <ul className="text-destructive/90 mt-1.5 list-disc pl-4">
                                {activeBuilds.builds.map((build) => (
                                    <li key={build.id}>{build.repositoryName}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            onClick={() => {
                                upgrade({ version });
                                closeDialog();
                            }}
                        >
                            {t('upgradeButton', { version })}
                        </Button>
                    </DialogFooter>
                </>
            ),
        });
    };

    return (
        <Card>
            <CardHeaderWithIcon
                icon={ArrowUpCircle}
                title={t('upgradeTitle')}
                description={t('upgradeDescription')}
            >
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isValidating}
                    className="ml-auto"
                    onClick={() => mutate()}
                >
                    <RefreshCw className={isValidating ? 'size-4 animate-spin' : 'size-4'} />
                    {t('upgradeCheckButton')}
                </Button>
            </CardHeaderWithIcon>
            <CardContent>
                {isRestarting ? (
                    <p className="text-muted-foreground text-sm">{t('upgradeRestarting')}</p>
                ) : isLoading || !data ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-40 self-end" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    {t('upgradeCurrentVersion')}
                                </span>
                                <span className="font-medium">{data.current}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    {t('upgradeLatestVersion')}
                                </span>
                                <span className="font-medium">{data.latest}</span>
                            </div>
                        </div>
                        {data.updateAvailable ? (
                            <Button
                                disabled={upgrading}
                                isLoading={upgrading}
                                className="self-end"
                                onClick={() => handleUpgrade(data.latest)}
                            >
                                {t('upgradeButton', { version: data.latest })}
                            </Button>
                        ) : (
                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                <CheckCircle2 className="size-4" />
                                {t('upgradeUpToDate')}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
