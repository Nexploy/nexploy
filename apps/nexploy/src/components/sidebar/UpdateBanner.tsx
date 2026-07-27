'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpCircle, Loader2, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { SidebarMenu, SidebarMenuItem } from '@workspace/ui/components/sidebar';
import { useUpdate } from '@/hooks/useUpdate';
import { usePermissions } from '@/contexts/PermissionContext';

const VERSION_REFRESH_INTERVAL = 60 * 60 * 1000;

const NEON = 'var(--primary)';
const neonAlpha = (percent: number) => `color-mix(in oklch, ${NEON} ${percent}%, transparent)`;

export function UpdateBanner() {
    const t = useTranslations('navigation');
    const { isAdmin } = usePermissions();

    const { version, isBannerVisible, isUpgrading, isRestarting, dismiss, openUpgradeDialog } =
        useUpdate({
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
                <div
                    className="animate-in fade-in slide-in-from-bottom-2 relative rounded-lg p-[1.5px] duration-500"
                    style={{ boxShadow: `0 0 20px 2px ${neonAlpha(30)}` }}
                >
                    <div className="absolute inset-0 overflow-hidden rounded-lg">
                        <div
                            className="absolute left-1/2 top-1/2 aspect-square w-[300%] -translate-x-1/2 -translate-y-1/2 animate-spin"
                            style={{
                                animationDuration: '6s',
                                background: `conic-gradient(from 0deg, transparent 0deg, transparent 240deg, ${neonAlpha(13)} 270deg, ${neonAlpha(53)} 320deg, ${NEON} 355deg, ${neonAlpha(53)} 360deg)`,
                            }}
                        />
                    </div>
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
                            className="relative mt-2 h-7 w-full text-xs transition-shadow"
                            style={{ boxShadow: `0 0 12px ${neonAlpha(45)}` }}
                            disabled={isBusy}
                            onClick={() => version && openUpgradeDialog(version.latest)}
                        >
                            {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : t('update')}
                        </Button>
                    </div>
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
