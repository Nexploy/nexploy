import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, } from '@workspace/ui/components/sidebar';
import Link from 'next/link';
import { AccountMenu } from '@/components/sidebar/AccountMenu';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { Environment } from '@/components/sidebar/environment/Environment';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { UpdateBanner } from '@/components/sidebar/UpdateBanner.tsx';
import Image from 'next/image';

interface AppSidebarProps {
    variant?: 'sidebar' | 'floating' | 'inset';
}

export async function AppSidebar({ variant }: AppSidebarProps) {
    return (
        <Sidebar
            className="z-50 px-0 whitespace-nowrap transition-all duration-300 ease-in-out"
            collapsible="icon"
            variant={variant}
        >
            <SidebarHeader
                className={
                    'mx-2 flex flex-row gap-4 overflow-hidden group-data-[state=collapsed]:flex-col'
                }
            >
                <Link href="/" className="flex flex-1 gap-2">
                    <Image
                        src="/assets/nexploy-logo.svg"
                        className="size-7 shrink-0 dark:invert"
                        alt="Nexploy Logo"
                        width={28}
                        height={28}
                    />
                    <div className="text-sx flex flex-1 flex-col text-sm leading-4 transition-[opacity] duration-200 ease-linear group-data-[state=collapsed]:opacity-0">
                        <span className="truncate font-bold">Nexploy</span>
                        <span className="text-muted-foreground truncate text-xs leading-3">
                            v{process.env.appVersion}
                        </span>
                    </div>
                </Link>
                <Environment />
            </SidebarHeader>
            <SidebarContent className="overflow-hidden">
                <ScrollAreaWithShadow
                    bottomShadow
                    className="h-full px-2"
                    colorShadow={'from-sidebar via-sidebar/50'}
                >
                    <SidebarNav />
                </ScrollAreaWithShadow>
            </SidebarContent>
            <SidebarFooter className={'mx-2'}>
                <UpdateBanner />
                <AccountMenu />
            </SidebarFooter>
        </Sidebar>
    );
}
