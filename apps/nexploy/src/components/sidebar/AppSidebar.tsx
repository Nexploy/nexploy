import {
    Activity,
    Box,
    ChevronRight,
    ChevronUp,
    Container,
    Folder,
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@workspace/ui/components/collapsible';
import * as React from 'react';
import { ElementType } from 'react';

interface AppSidebarProps {
    variant?: 'sidebar' | 'floating' | 'inset';
}

interface SidebarItem {
    title: string;
    icon: ElementType;
    href: string;
    children?: { title: string; href: string; icon: ElementType }[];
}

const items: SidebarItem[] = [
    { title: 'Projects', href: '/projects', icon: Folder },
    { title: 'Monitoring', href: '/monitoring', icon: Activity },
    {
        title: 'Docker',
        href: '/docker/containers',
        icon: Box,
        children: [
            { title: 'Containers', icon: Container, href: './containers' },
            { title: 'Images', icon: LayoutList, href: './images' },
        ],
    },
    { title: 'Swarm', href: '/swarm', icon: Network },
    { title: 'Requests', href: '/requests', icon: Send },
];

export function AppSidebar({ variant }: AppSidebarProps) {
    return (
        <Sidebar className="whitespace-nowrap" collapsible="icon" variant={variant}>
            <SidebarHeader className="flex flex-col gap-0 truncate">
                <span>Nexploy</span>
                <span className="text-muted-foreground text-xs">v1.0.0</span>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Home</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <Collapsible key={item.title} className="group/collapsible">
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip={item.title} asChild>
                                                <Link href={item.href}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                    {item.children && (
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    )}
                                                </Link>
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        {item.children && (
                                            <CollapsibleContent>
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
                                            </CollapsibleContent>
                                        )}
                                    </SidebarMenuItem>
                                </Collapsible>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
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
