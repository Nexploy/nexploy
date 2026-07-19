'use client';

import useSWR from 'swr';
import { useLocalStorage } from 'usehooks-ts';
import { useAction } from 'next-safe-action/hooks';
import { useTranslations } from 'next-intl';
import { ArrowUpCircle, Loader2, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { DialogFooter } from '@workspace/ui/components/dialog';
import { SidebarMenu, SidebarMenuItem } from '@workspace/ui/components/sidebar';
import { fetcherApi } from '@/lib/api/fetcherApi';
import { triggerUpgradeAction } from '@/actions/admin/triggerUpgrade.action';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';

interface VersionInfo {
    current: string;
    latest: string;
    updateAvailable: boolean;
}

const DISMISS_KEY = 'nexploy-update-dismissed-version';

export function UpdateBanner() {
    const t = useTranslations('navigation');
    const tSettings = useTranslations('admin.settings');
    const tCommon = useTranslations('common');
    const [dismissedVersion, setDismissedVersion] = useLocalStorage<string | null>(
        DISMISS_KEY,
        null,
    );

    const { data } = useSWR<VersionInfo | null>(
        { url: '/api/admin/version', disableToast: true },
        fetcherApi,
        { refreshInterval: 60 * 60 * 1000, shouldRetryOnError: false },
    );

    const { openDialog, closeDialog } = useConfirmationDialogStore();

    const { execute: upgrade, isPending: upgrading } = useAction(triggerUpgradeAction);

    if (!data?.updateAvailable || data.latest === dismissedVersion) {
        return null;
    }

    const dismiss = () => setDismissedVersion(data.latest);

    const handleUpgrade = (version: string) => {
        openDialog({
            title: tSettings('upgradeConfirmTitle'),
            description: tSettings('upgradeWarning'),
            content: (
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
                        {tSettings('upgradeButton', { version })}
                    </Button>
                </DialogFooter>
            ),
        });
    };

    return (
        <SidebarMenu className="group-data-[state=collapsed]:hidden">
            <SidebarMenuItem>
                <div className="bg-primary/10 border-primary/20 rounded-lg border p-2.5">
                    <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                            <ArrowUpCircle className="text-primary size-4 shrink-0" />
                            <span className="text-sm font-medium">{t('updateAvailable')}</span>
                        </div>
                        <button
                            type="button"
                            onClick={dismiss}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                        {t('updateDescription', { version: data.latest })}
                    </p>
                    <Button
                        size="sm"
                        className="mt-2 h-7 w-full text-xs"
                        disabled={upgrading}
                        onClick={() => handleUpgrade(data.latest)}
                    >
                        {upgrading ? <Loader2 className="size-3.5 animate-spin" /> : t('update')}
                    </Button>
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
