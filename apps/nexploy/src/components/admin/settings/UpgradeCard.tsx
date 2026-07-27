'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useUpdate } from '@/hooks/useUpdate';
import { usePermissions } from '@/contexts/PermissionContext';

export function UpgradeCard() {
    const t = useTranslations('admin.settings');
    const { isAdmin } = usePermissions();

    const {
        version,
        isLoading,
        isChecking,
        isUpgrading,
        isRestarting,
        refresh,
        openUpgradeDialog,
    } = useUpdate({ enabled: isAdmin });

    if (!isAdmin) {
        return null;
    }

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
                    disabled={isChecking}
                    className="ml-auto"
                    onClick={() => refresh()}
                >
                    <RefreshCw className={isChecking ? 'size-4 animate-spin' : 'size-4'} />
                    {t('upgradeCheckButton')}
                </Button>
            </CardHeaderWithIcon>
            <CardContent>
                {isRestarting ? (
                    <p className="text-muted-foreground text-sm">{t('upgradeRestarting')}</p>
                ) : isLoading || !version ? (
                    <div className="flex flex-1 items-center gap-4">
                        <div className="flex flex-1 flex-col gap-2 rounded-lg border p-4 text-sm">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-4 shrink-0" />
                        <div className="flex flex-1 flex-col gap-2 rounded-lg border p-4 text-sm">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {version.updateAvailable ? (
                            <>
                                <div className="flex flex-1 items-center gap-4">
                                    <div className="flex flex-1 flex-col gap-2 rounded-lg border p-4 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">
                                                {t('upgradeCurrentVersion')}
                                            </span>
                                            <span className="font-medium">{version.current}</span>
                                        </div>
                                    </div>
                                    →
                                    <div className="flex flex-1 flex-col gap-2 rounded-lg border p-4 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">
                                                {t('upgradeNewVersion')}
                                            </span>
                                            <span className="font-medium">{version.latest}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    disabled={isUpgrading}
                                    isLoading={isUpgrading}
                                    className="self-end"
                                    onClick={() => openUpgradeDialog(version.latest)}
                                >
                                    {t('upgradeButton', { version: version.latest })}
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        {t('upgradeCurrentVersion')}
                                    </span>
                                    <span className="font-medium">{version.current}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
