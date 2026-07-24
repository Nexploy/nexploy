import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@workspace/ui/components/sidebar';
import Link from 'next/link';
import { AccountMenu } from '@/components/sidebar/AccountMenu';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { Environment } from '@/components/sidebar/environment/Environment';
import { Organization } from '@/components/sidebar/organization/Organization';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import Image from 'next/image';
import { UpdateBanner } from './UpdateBanner';
import { AppVersion } from './AppVersion';
import { ExternalLinks } from './ExternalLinks';

interface AppSidebarProps {
    variant?: 'sidebar' | 'floating' | 'inset';
}

export async function AppSidebar({ variant }: AppSidebarProps) {
    return (
        <Sidebar
            className="z-50 whitespace-nowrap px-0 transition-all duration-300 ease-in-out"
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
                        className="size-7 shrink-0 select-none dark:invert"
                        alt="Nexploy Logo"
                        width={28}
                        height={28}
                    />
                    <div className="text-sx flex flex-1 flex-col text-sm leading-4 transition-opacity duration-200 ease-linear group-data-[state=collapsed]:opacity-0">
                        <span className="truncate font-bold">Nexploy</span>
                        <AppVersion />
                    </div>
                </Link>
                <Environment />
            </SidebarHeader>
            <Organization />
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
                <ExternalLinks />
                <AccountMenu />
            </SidebarFooter>
        </Sidebar>
    );
}
