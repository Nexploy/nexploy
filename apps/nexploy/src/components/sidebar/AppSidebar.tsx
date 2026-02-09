import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@workspace/ui/components/sidebar';
import Link from 'next/link';
import { AccountMenu } from '@/components/sidebar/AccountMenu';
import { NexployLogo } from '@/components/sidebar/NexployLogo';
import { Environment } from '@/components/sidebar/environment/Environment';
import { SidebarNav } from '@/components/sidebar/SidebarNav';
import { getTranslations } from 'next-intl/server';

interface AppSidebarProps {
    variant?: 'sidebar' | 'floating' | 'inset';
}

export async function AppSidebar({ variant }: AppSidebarProps) {
    const t = await getTranslations('navigation');

    const translations = {
        home: t('home'),
        repositories: t('repositories'),
        monitoring: t('monitoring'),
        docker: t('docker'),
        containers: t('containers'),
        images: t('images'),
        volumes: t('volumes'),
        networks: t('networks'),
        events: t('events'),
        swarm: t('swarm'),
        requests: t('requests'),
        admin: t('admin'),
        users: t('users'),
        backups: t('backups'),
    };

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
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex aspect-square size-7 items-center justify-center rounded-none">
                        <NexployLogo className="size-7" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight transition-opacity duration-300 ease-in-out group-data-[state=collapsed]:opacity-0">
                        <span className="truncate font-bold">Nexploy</span>
                        <span className="text-muted-foreground truncate text-xs">
                            v{process.env.appVersion}
                        </span>
                    </div>
                </Link>
                <Environment />
            </SidebarHeader>
            <SidebarContent>
                <SidebarNav translations={translations} />
            </SidebarContent>
            <SidebarFooter>
                <AccountMenu />
            </SidebarFooter>
        </Sidebar>
    );
}
