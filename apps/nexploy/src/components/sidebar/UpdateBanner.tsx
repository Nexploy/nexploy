'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpCircle, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { SidebarMenu, SidebarMenuItem } from '@workspace/ui/components/sidebar';

export function UpdateBanner() {
    const t = useTranslations('navigation');

    return (
        <SidebarMenu className="group-data-[state=collapsed]:hidden">
            <SidebarMenuItem>
                <div className="bg-primary/10 border-primary/20 rounded-lg border p-2.5">
                    <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                            <ArrowUpCircle className="text-primary size-4 shrink-0" />
                            <span className="text-sm font-medium">{t('updateAvailable')}</span>
                        </div>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="size-3.5" />
                        </button>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                        {t('updateDescription', { version: '1.2.0' })}
                    </p>
                    <Button size="sm" className="mt-2 h-7 w-full text-xs">
                        {t('update')}
                    </Button>
                </div>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
