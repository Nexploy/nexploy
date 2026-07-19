'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Globe } from 'lucide-react';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@workspace/ui/components/sidebar';

export function ExternalLinks() {
    const t = useTranslations('navigation');

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('website')} asChild>
                    <a href="https://nexploy.app" target="_blank" rel="noopener noreferrer">
                        <Globe />
                        <span>{t('website')}</span>
                    </a>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip={t('documentation')} asChild>
                    <a href="https://docs.nexploy.app" target="_blank" rel="noopener noreferrer">
                        <BookOpen />
                        <span>{t('documentation')}</span>
                    </a>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
