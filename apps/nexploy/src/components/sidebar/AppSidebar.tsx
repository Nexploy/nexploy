import {
    Activity,
    Box,
    Bug,
    ChevronUp,
    Container,
    EthernetPort,
    Folder,
    GitBranch,
    HardDrive,
    LayoutList,
    Network,
    Send,
    User2,
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { ElementType, ReactElement } from 'react';
import { RefreshDocker } from '@/components/sidebar/RefreshDocker';

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
                actionIcon: <RefreshDocker />,
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
        <Sidebar className="whitespace-nowrap" collapsible="icon" variant={variant}>
            <SidebarHeader className="flex flex-col gap-0 truncate">
                <span>Nexploy</span>
                <span className="text-muted-foreground text-xs">v1.0.0</span>
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
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton>
                                    <User2 /> Username
                                    <ChevronUp className="ml-auto" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                <DropdownMenuItem>Account</DropdownMenuItem>
                                <DropdownMenuItem>Billing</DropdownMenuItem>
                                <DropdownMenuItem>Sign out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
