'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Globe } from 'lucide-react';
import Github from '@thesvg/react/github';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@workspace/ui/components/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Separator } from '@workspace/ui/components/separator.tsx';

export function ExternalLinks() {
    const t = useTranslations('navigation');
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile;

    return (
        <SidebarMenu
            className={
                isCollapsed
                    ? 'w-8 flex-col items-center gap-0 rounded-md border p-0.5'
                    : 'flex-row items-center gap-0 rounded-md border p-0.5'
            }
        >
            <div className={isCollapsed ? 'flex flex-col' : 'flex flex-1'}>
                <SidebarMenuItem>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SidebarMenuButton asChild className="size-8 justify-center">
                                <a
                                    href="https://nexploy.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Globe />
                                </a>
                            </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="top">{t('website')}</TooltipContent>
                    </Tooltip>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SidebarMenuButton asChild className="size-8 justify-center">
                                <a
                                    href="https://docs.nexploy.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <BookOpen />
                                </a>
                            </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="top">{t('documentation')}</TooltipContent>
                    </Tooltip>
                </SidebarMenuItem>
            </div>
            <Separator
                orientation={isCollapsed ? 'horizontal' : 'vertical'}
                className={isCollapsed ? 'my-1 w-6!' : 'mx-1 h-6!'}
            />
            <SidebarMenuItem>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SidebarMenuButton asChild className="size-8 justify-center">
                            <a
                                href="https://github.com/Nexploy/nexploy"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Github className="[&_path]:fill-current" />
                            </a>
                        </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="top">{t('github')}</TooltipContent>
                </Tooltip>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
