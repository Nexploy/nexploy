'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useAction } from 'next-safe-action/hooks';
import { useTranslations } from 'next-intl';
import { ArrowUpCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { triggerUpgradeAction } from '@/actions/admin/triggerUpgrade.action';

interface VersionInfo {
    current: string;
    latest: string;
    updateAvailable: boolean;
}

export function UpgradeCard() {
    const t = useTranslations('admin.settings');
    const [isRestarting, setIsRestarting] = useState(false);

    const { data, isLoading } = useSWR<VersionInfo | null>(
        { url: '/api/admin/version', disableToast: true },
        fetcherApi,
    );

    const { execute: upgrade, isPending: upgrading } = useAction(triggerUpgradeAction, {
        onSuccess: () => setIsRestarting(true),
        onError: () => setIsRestarting(true),
    });

    return (
        <Card>
            <CardHeaderWithIcon
                icon={ArrowUpCircle}
                title={t('upgradeTitle')}
                description={t('upgradeDescription')}
            />
            <CardContent>
                {isRestarting ? (
                    <p className="text-muted-foreground text-sm">{t('upgradeRestarting')}</p>
                ) : isLoading || !data ? (
                    <Loader2 className="text-muted-foreground size-5 animate-spin" />
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
                            <>
                                <p className="text-muted-foreground text-xs">
                                    {t('upgradeWarning')}
                                </p>
                                <Button
                                    disabled={upgrading}
                                    isLoading={upgrading}
                                    className="self-end"
                                    onClick={() => upgrade({ version: data.latest })}
                                >
                                    {t('upgradeButton', { version: data.latest })}
                                </Button>
                            </>
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
