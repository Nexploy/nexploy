'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpCircle, Loader2, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { SidebarMenu, SidebarMenuItem } from '@workspace/ui/components/sidebar';
import { useUpdate } from '@/hooks/useUpdate';
import { usePermissions } from '@/contexts/PermissionContext';

const VERSION_REFRESH_INTERVAL = 60 * 60 * 1000;

export function UpdateBanner() {
    const t = useTranslations('navigation');
    const { isAdmin } = usePermissions();

    const { version, isBannerVisible, isUpgrading, isRestarting, dismiss, openUpgradeDialog } = useUpdate({
        enabled: isAdmin,
        refreshInterval: VERSION_REFRESH_INTERVAL,
    });

    if (!isAdmin || !version || !isBannerVisible) {
        return null;
    }

    const isBusy = isUpgrading || isRestarting;

    return (
        <SidebarMenu className="group-data-[state=collapsed]:hidden">
            <SidebarMenuItem>
                <div className="animate-in fade-in slide-in-from-bottom-2 border relative rounded-lg p-[1.5px] duration-500">
                    <div className="bg-sidebar relative overflow-hidden rounded-[calc(var(--radius)-1.5px)] p-2.5">
                        <div className="relative flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                                <ArrowUpCircle className="text-primary relative size-4" />
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
                        <p className="text-muted-foreground relative mt-1 text-xs">
                            {t('updateDescription', { version: version?.latest ?? '' })}
                        </p>
                        <Button
                            size="sm"
                            className="mt-2 h-7 w-full text-xs"
                            disabled={isBusy}
                            onClick={() => openUpgradeDialog()}
                        >
                            {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : t('update')}
                        </Button>
                    </div>
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
