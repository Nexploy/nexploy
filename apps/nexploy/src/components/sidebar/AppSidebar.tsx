'use client'

import { Activity, Container, Folder, LayoutDashboard, Network, Send } from 'lucide-react'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
    useSidebar,
} from '@workspace/ui/components/sidebar'
import Link from 'next/link';

interface AppSidebarProps {
    variant?: 'sidebar' | 'floating' | 'inset'
    paths: {
        accountId: string
    }
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

export function AppSidebar({ variant, paths }: AppSidebarProps) {
    const { setOpenMobile } = useSidebar()

    return (
        <Sidebar className={'whitespace-nowrap'} collapsible={'icon'} variant={variant}>
            <SidebarContent className={'overflow-hidden'}>
                <SidebarGroup>
                    <SidebarMenuButton asChild>
                        <Link onClick={() => setOpenMobile(false)} href={`/dashboard`}>
                            <LayoutDashboard/>
                            <span>Dashboard</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarGroup>
                <SidebarSeparator/>
                <SidebarGroup>
                    <SidebarGroupLabel>Home</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            onClick={() => setOpenMobile(false)}
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
            </SidebarFooter>
        </Sidebar>
    )
}
