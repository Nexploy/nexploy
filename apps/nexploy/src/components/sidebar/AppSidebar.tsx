import { Activity, ChevronUp, Container, Folder, Network, Send, User2 } from 'lucide-react'

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
} from '@workspace/ui/components/sidebar'
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@workspace/ui/components/dropdown-menu';

interface AppSidebarProps {
    variant?: 'sidebar' | 'floating' | 'inset'
}

const items = [
    {
        title: 'Projects',
        icon: Folder,
    },
    {
        title: 'Monitoring',
        icon: Activity,
    },
    {
        title: 'Docker',
        icon: Container,
    },
    {
        title: 'Swarm',
        icon: Network,
    },
    {
        title: 'Requests',
        icon: Send,
    },
];

export function AppSidebar({ variant }: AppSidebarProps) {
    return (
        <Sidebar className={'whitespace-nowrap'} collapsible={'icon'} variant={variant}>
            <SidebarHeader className={'flex flex-col gap-0 truncate'}>
                <span>Nexploy</span>
                <span className={'text-xs text-muted-foreground'}>v1.0.0</span>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Home</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href={`./${item.title.toLowerCase()}`}>
                                            <item.icon/>
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
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
                                    <User2/> Username
                                    <ChevronUp className="ml-auto"/>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className={'min-w-32 w-[var(--radix-dropdown-menu-trigger-width)]'}>
                                <DropdownMenuItem>
                                    <span>Account</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <span>Billing</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
