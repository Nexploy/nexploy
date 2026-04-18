'use client';

import {
    Activity,
    Box,
    Bug,
    ChevronRight,
    Container,
    Database,
    EthernetPort,
    Folder,
    HardDrive,
    LayoutList,
    Network,
    Plug,
    Send,
    Users,
    Warehouse,
} from 'lucide-react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@workspace/ui/components/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import Link from 'next/link';
import { RefreshDocker } from '@/components/sidebar/RefreshDocker';
import { usePermissions } from '@/contexts/PermissionContext';
import type { SidebarNavGroup } from '@workspace/typescript-interface/sidebar/sidebarNav';
import { useTranslations } from 'next-intl';

const groups: SidebarNavGroup[] = [
    {
        titleKey: 'home',
        children: [
            {
                titleKey: 'repositories',
                href: '/repositories',
                icon: Folder,
            },
            {
                titleKey: 'monitoring',
                href: '/monitoring',
                icon: Activity,
            },
            {
                titleKey: 'docker',
                href: '/docker/containers',
                icon: Box,
                actionIcon: <RefreshDocker />,
                enableCollapsible: false,
                children: [
                    { titleKey: 'containers', icon: Container, href: '/docker/containers' },
                    { titleKey: 'images', icon: LayoutList, href: '/docker/images' },
                    { titleKey: 'volumes', icon: HardDrive, href: '/docker/volumes' },
                    { titleKey: 'networks', icon: EthernetPort, href: '/docker/networks' },
                    { titleKey: 'events', icon: Bug, href: '/docker/events' },
                ],
            },
            { titleKey: 'swarm', href: '/swarm', icon: Network },
            { titleKey: 'requests', href: '/requests', icon: Send },
        ],
    },
    {
        titleKey: 'admin',
        children: [
            { titleKey: 'users', href: '/admin/users', icon: Users },
            { titleKey: 'integrations', href: '/admin/integrations', icon: Plug },
            { titleKey: 'backups', href: '/admin/backups', icon: Database },
            { titleKey: 'registry', href: '/admin/registry', icon: Warehouse },
            // { titleKey: 'ai', href: '/admin/ai', icon: Bot },
            // { titleKey: 'tools', href: '/admin/tools', icon: Hammer },
        ],
    },
];

export function SidebarNav() {
    const t = useTranslations('navigation');
    const { isAdmin } = usePermissions();

    const filteredGroups = groups.filter((group) => !(group.titleKey === 'admin' && !isAdmin));

    return (
        <>
            {filteredGroups.map((group) => (
                <SidebarGroup className={'pt-0'} key={group.titleKey}>
                    <SidebarGroupLabel>{t(group.titleKey)}</SidebarGroupLabel>
                    <SidebarMenu>
                        {group.children.map((item) => {
                            const title = t(item.titleKey);

                            if (item.children) {
                                const subItems = (
                                    <SidebarMenuSub>
                                        {item.children.map((child) => (
                                            <SidebarMenuSubItem key={child.titleKey}>
                                                <SidebarMenuSubButton asChild>
                                                    <Link href={child.href}>
                                                        <child.icon />
                                                        {t(child.titleKey)}
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                );

                                if (item.enableCollapsible === false) {
                                    return (
                                        <SidebarMenuItem key={item.titleKey}>
                                            <SidebarMenuButton tooltip={title} asChild>
                                                <Link href={item.href}>
                                                    <item.icon />
                                                    <span>{title}</span>
                                                    {item.actionIcon}
                                                </Link>
                                            </SidebarMenuButton>
                                            {subItems}
                                        </SidebarMenuItem>
                                    );
                                }

                                return (
                                    <Collapsible
                                        key={item.titleKey}
                                        asChild
                                        defaultOpen
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip={title}>
                                                    <item.icon />
                                                    <span>{title}</span>
                                                    {item.actionIcon}
                                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>{subItems}</CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                );
                            }

                            return (
                                <SidebarMenuItem key={item.titleKey}>
                                    <SidebarMenuButton tooltip={title} asChild>
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span>{title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    );
}
