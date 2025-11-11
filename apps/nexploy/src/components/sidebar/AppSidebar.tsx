import {
    Activity,
    Box,
    Bug,
    Container,
    EthernetPort,
    Folder,
    GitBranch,
    HardDrive,
    LayoutList,
    Network,
    Send,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@workspace/ui/components/sidebar';
import Link from 'next/link';
import { ElementType, ReactElement } from 'react';
import { NexployLogo } from '@/components/sidebar/NexployLogo';
import { AccountMenu } from '@/components/sidebar/AccountMenu';

interface AppSidebarProps {
    variant?: 'sidebar' | 'floating' | 'inset';
}

interface Group {
    title: string;
    children: SidebarItem[];
}

interface SidebarItem {
    title: string;
    icon: ElementType;
    href: string;
    actionIcon?: ReactElement;
    children?: { title: string; href: string; icon: ElementType }[];
}

const groups: Group[] = [
    {
        title: 'Home',
        children: [
            { title: 'Projects', href: '/projects', icon: Folder },
            { title: 'Monitoring', href: '/monitoring', icon: Activity },
            {
                title: 'Docker',
                href: '/docker/containers',
                icon: Box,
                // actionIcon: <RefreshDocker />,
                children: [
                    { title: 'Containers', icon: Container, href: '/docker/containers' },
                    { title: 'Images', icon: LayoutList, href: '/docker/images' },
                    { title: 'Volumes', icon: HardDrive, href: '/docker/volumes' },
                    { title: 'Networks', icon: EthernetPort, href: '/docker/networks' },
                    { title: 'Events', icon: Bug, href: '/docker/events' },
                ],
            },
            { title: 'Swarm', href: '/swarm', icon: Network },
            { title: 'Requests', href: '/requests', icon: Send },
        ],
    },
    {
        title: 'Settings',
        children: [{ title: 'Git', href: '/settings', icon: GitBranch }],
    },
];

export function AppSidebar({ variant }: AppSidebarProps) {
    return (
        <Sidebar className="z-50 whitespace-nowrap" collapsible="icon" variant={variant}>
            <SidebarHeader>
                <Link href="/" className={'flex items-center gap-2'}>
                    <div className="flex aspect-square size-7 items-center justify-center rounded-none">
                        <NexployLogo className="size-7" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-bold">Nexploy</span>
                        <span className="text-muted-foreground truncate text-xs">
                            v{process.env.appVersion}
                        </span>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.children.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton tooltip={item.title} asChild>
                                            <Link href={item.href}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                                {item.actionIcon}
                                            </Link>
                                        </SidebarMenuButton>
                                        {item.children && (
                                            <SidebarMenuSub>
                                                {item.children.map((child) => (
                                                    <SidebarMenuSubItem key={child.title}>
                                                        <SidebarMenuSubButton asChild>
                                                            <Link href={child.href}>
                                                                <child.icon />
                                                                {child.title}
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        )}
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <AccountMenu />
            </SidebarFooter>
        </Sidebar>
    );
}
