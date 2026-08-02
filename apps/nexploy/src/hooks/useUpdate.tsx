'use client';

import { useEffect } from 'react';
import { useAction } from 'next-safe-action/hooks';
import { useTranslations } from 'next-intl';
import { Button } from '@workspace/ui/components/button';
import { DialogFooter } from '@workspace/ui/components/dialog';
import type { ActiveBuildInfo } from '@workspace/typescript-interface/stores/updateStore';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { triggerUpgradeAction } from '@/actions/admin/triggerUpgrade.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useUpdateStore } from '@/stores/admin/useUpdateStore';

interface UseUpdateOptions {
    enabled?: boolean;
    refreshInterval?: number;
}

export function useUpdate({ enabled = true, refreshInterval }: UseUpdateOptions = {}) {
    const t = useTranslations('admin.settings');
    const tCommon = useTranslations('common');

    const version = useUpdateStore((state) => state.version);
    const isLoading = useUpdateStore((state) => state.isLoading);
    const isChecking = useUpdateStore((state) => state.isChecking);
    const isUpgrading = useUpdateStore((state) => state.isUpgrading);
    const isRestarting = useUpdateStore((state) => state.isRestarting);
    const dismissedVersion = useUpdateStore((state) => state.dismissedVersion);
    const fetchVersion = useUpdateStore((state) => state.fetchVersion);
    const checkForUpdate = useUpdateStore((state) => state.checkForUpdate);
    const dismiss = useUpdateStore((state) => state.dismiss);
    const setUpgrading = useUpdateStore((state) => state.setUpgrading);
    const setRestarting = useUpdateStore((state) => state.setRestarting);

    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const { execute: upgrade } = useAction(triggerUpgradeAction, {
        onExecute: () => setUpgrading(true),
        onSettled: () => {
            setUpgrading(false);
            setRestarting(true);
        },
    });

    useEffect(() => {
        if (!enabled) return;

        checkForUpdate();

        if (!refreshInterval) return;

        const timer = setInterval(() => fetchVersion(), refreshInterval);
        return () => clearInterval(timer);
    }, [enabled, refreshInterval, checkForUpdate, fetchVersion]);

    const openUpgradeDialog = async (targetVersion: string) => {
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
                            <p className="text-destructive font-medium">{t('upgradeActiveBuildsWarning')}</p>
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
                                upgrade({ version: targetVersion });
                                closeDialog();
                            }}
                        >
                            {t('upgradeButton', { version: targetVersion })}
                        </Button>
                    </DialogFooter>
                </>
            ),
        });
    };

    const updateAvailable = version?.updateAvailable === true;

    return {
        version,
        isLoading,
        isChecking,
        isUpgrading,
        isRestarting,
        updateAvailable,
        isBannerVisible: updateAvailable && version.latest !== dismissedVersion,
        refresh: fetchVersion,
        dismiss,
        openUpgradeDialog,
    };
}
