import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@workspace/ui/components/sidebar';
import Link from 'next/link';
import { AccountMenu } from '@/components/sidebar/AccountMenu';
import { NexployLogo } from '@/components/sidebar/NexployLogo';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { Environment } from '@/components/sidebar/environment/Environment';

interface AppSidebarProps {
    variant?: 'sidebar' | 'floating' | 'inset';
}

export async function AppSidebar({ variant }: AppSidebarProps) {
    return (
        <Sidebar
            className="z-50 whitespace-nowrap transition-all duration-300 ease-in-out"
            collapsible="icon"
            variant={variant}
        >
            <SidebarHeader
                className={
                    'flex flex-row justify-between gap-4 overflow-hidden group-data-[state=collapsed]:flex-col'
                }
            >
                <Link href="/" className="flex gap-2">
                    <NexployLogo className="size-7 shrink-0" />
                    <div className="text-sx flex flex-col text-sm leading-none transition-[opacity] duration-200 ease-linear group-data-[state=collapsed]:opacity-0">
                        <span className="truncate font-bold">Nexploy</span>
                        <span className="text-muted-foreground truncate text-xs">
                            v{process.env.appVersion}
                        </span>
                    </div>
                </Link>
                <Environment />
            </SidebarHeader>
            <SidebarContent>
                <SidebarNav />
            </SidebarContent>
            <SidebarFooter>
                <AccountMenu />
            </SidebarFooter>
        </Sidebar>
    );
}
