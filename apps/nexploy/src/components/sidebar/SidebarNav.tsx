'use client';

import {
    Activity,
    Bot,
    Box,
    Bug,
    ChevronRight,
    Container,
    Cpu,
    Database,
    EthernetPort,
    FolderGit2,
    HardDrive,
    LayoutList,
    Network,
    Plug,
    Send,
    Shield,
    SlidersHorizontal,
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
import { NavPermission, usePermissions } from '@/contexts/PermissionContext';
import type { SidebarItem, SidebarNavGroup } from '@workspace/typescript-interface/sidebar/sidebarNav';
import { useTranslations } from 'next-intl';

interface PermissionedSidebarItem extends SidebarItem {
    permission?: NavPermission;
    children?: PermissionedSidebarItem[];
}

interface PermissionedSidebarNavGroup extends SidebarNavGroup {
    children: PermissionedSidebarItem[];
}

const groups: PermissionedSidebarNavGroup[] = [
    {
        titleKey: 'home',
        children: [
            {
                titleKey: 'repositories',
                href: '/repositories',
                icon: FolderGit2,
                permission: { resource: 'repository', action: 'read' },
            },
            {
                titleKey: 'monitoring',
                href: '/monitoring',
                icon: Activity,
                permission: { resource: 'docker', action: 'read' },
            },
            {
                titleKey: 'docker',
                href: '/docker/containers',
                icon: Box,
                actionIcon: <RefreshDocker />,
                enableCollapsible: false,
                permission: { resource: 'docker', action: 'read' },
                children: [
                    { titleKey: 'containers', icon: Container, href: '/docker/containers' },
                    { titleKey: 'images', icon: LayoutList, href: '/docker/images' },
                    { titleKey: 'volumes', icon: HardDrive, href: '/docker/volumes' },
                    { titleKey: 'networks', icon: EthernetPort, href: '/docker/networks' },
                    { titleKey: 'events', icon: Bug, href: '/docker/events' },
                ],
            },
            {
                titleKey: 'swarm',
                href: '/swarm',
                icon: Network,
                permission: { resource: 'docker', action: 'manage' },
            },
            { titleKey: 'requests', href: '/requests', icon: Send },
            {
                titleKey: 'registry',
                href: '/admin/registry',
                icon: Warehouse,
                permission: { resource: 'registry', action: 'read' },
            },
        ],
    },
    {
        titleKey: 'admin',
        children: [
            {
                titleKey: 'users',
                href: '/admin/users',
                icon: Users,
                permission: { resource: 'user', action: 'ban' },
            },
            {
                titleKey: 'integrations',
                href: '/admin/integrations',
                icon: Plug,
                permission: { resource: 'gitProvider', action: 'create' },
            },
            {
                titleKey: 'ai',
                href: '/admin/ai/models',
                icon: Bot,
                permission: { resource: 'ai', action: 'manage' },
                children: [
                    { titleKey: 'models', icon: Cpu, href: '/admin/ai/models' },
                    { titleKey: 'mcp', icon: Network, href: '/admin/ai/mcp' },
                    { titleKey: 'settings', icon: SlidersHorizontal, href: '/admin/ai/settings' },
                ],
            },
            {
                titleKey: 'backups',
                href: '/admin/backups',
                icon: Database,
                permission: { resource: 'backup', action: 'read' },
            },
            {
                titleKey: 'sslCertificates',
                href: '/admin/ssl-certificates',
                icon: Shield,
                permission: { resource: 'repository', action: 'update' },
            },
        ],
    },
];

export function SidebarNav() {
    const t = useTranslations('navigation');
    const { can } = usePermissions();

    const filteredGroups = groups
        .map((group) => ({
            ...group,
            children: group.children.filter(
                (item) => !item.permission || can(item.permission.resource, item.permission.action),
            ),
        }))
        .filter((group) => group.children.length > 0);

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
