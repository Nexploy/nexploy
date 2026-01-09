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
    Send,
    Settings,
    Users,
} from 'lucide-react';
import {
    SidebarGroup,
    SidebarGroupContent,
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
import { ElementType } from 'react';
import { RefreshDocker } from '@/components/sidebar/RefreshDocker';

interface SidebarNavProps {
    translations: {
        home: string;
        repositories: string;
        monitoring: string;
        docker: string;
        containers: string;
        images: string;
        volumes: string;
        networks: string;
        events: string;
        swarm: string;
        requests: string;
        admin: string;
        users: string;
        backups: string;
        preferences: string;
    };
}

interface Group {
    titleKey: keyof SidebarNavProps['translations'];
    children: SidebarItem[];
}

interface SidebarItem {
    titleKey: keyof SidebarNavProps['translations'];
    icon: ElementType;
    href: string;
    className?: string;
    hasActionIcon?: boolean;
    enableCollapsible?: boolean;
    children?: SidebarItem[];
}

const groups: Group[] = [
    {
        titleKey: 'home',
        children: [
            {
                titleKey: 'repositories',
                href: '/repositories',
                enableCollapsible: true,
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
                hasActionIcon: true,
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
            { titleKey: 'backups', href: '/admin/backups', icon: Database },
            { titleKey: 'preferences', href: '/settings/preferences', icon: Settings },
        ],
    },
];

export function SidebarNav({ translations }: SidebarNavProps) {
    const t = (key: keyof SidebarNavProps['translations']) => translations[key];

    return (
        <>
            {groups.map((group) => (
                <SidebarGroup key={group.titleKey}>
                    <SidebarGroupLabel>{t(group.titleKey)}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {group.children.map((item) => {
                                const title = t(item.titleKey);
                                const actionIcon = item.hasActionIcon ? <RefreshDocker /> : undefined;

                                if (!item.enableCollapsible || !item.children) {
                                    return (
                                        <SidebarMenuItem key={item.titleKey}>
                                            <SidebarMenuButton tooltip={title} asChild>
                                                <Link className={item.className} href={item.href}>
                                                    <item.icon />
                                                    <span>{title}</span>
                                                    {actionIcon}
                                                </Link>
                                            </SidebarMenuButton>
                                            {item.children && (
                                                <SidebarMenuSub>
                                                    {item.children.map((child) => (
                                                        <SidebarMenuSubItem key={child.titleKey}>
                                                            <SidebarMenuSubButton asChild>
                                                                <Link
                                                                    className={child.className}
                                                                    href={child.href}
                                                                >
                                                                    <child.icon />
                                                                    {t(child.titleKey)}
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    ))}
                                                </SidebarMenuSub>
                                            )}
                                        </SidebarMenuItem>
                                    );
                                }

                                return (
                                    <Collapsible
                                        key={item.titleKey}
                                        defaultOpen
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton tooltip={title} asChild>
                                                    <Link href={item.href}>
                                                        <item.icon />
                                                        <span>{title}</span>
                                                        <ChevronRight
                                                            className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                                                            size={16}
                                                        />
                                                    </Link>
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
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
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    );
}
