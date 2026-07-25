'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Globe } from 'lucide-react';
import Github from '@thesvg/react/github';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@workspace/ui/components/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Separator } from '@workspace/ui/components/separator.tsx';

export function ExternalLinks() {
    const t = useTranslations('navigation');

    return (
        <SidebarMenu className="flex-row items-center gap-0 rounded-md border p-0.5 group-data-[collapsible=icon]:flex-col">
            <div className={'flex flex-1'}>
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
            <Separator orientation={'vertical'} className={'h-6! mx-1'} />
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
