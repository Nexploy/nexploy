'use client';

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@workspace/ui/components/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { ChevronUp, User } from 'lucide-react';
import Link from 'next/link';
import { ChangeTheme } from '@/components/sidebar/ChangeTheme';
import { ChangeLanguage } from '@/components/sidebar/ChangeLanguage';
import { SignOutButton } from '@/components/account/SignOutButton';
import { useTranslations } from 'next-intl';
import type { Session } from '@/lib/auth/auth';
import { DicebearAvatar } from '@/components/shared/DicebearAvatar';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';

interface AccountMenuClientProps {
    session: Session | null;
}

export function AccountMenuClient({ session }: AccountMenuClientProps) {
    const { isMobile, state } = useSidebar();
    const tAccount = useTranslations('account');

    const isSidebarExpanded = state === 'expanded' || isMobile;

    return (
        <SidebarMenu className={'group-data-[collapsible=icon]:items-center'}>
            <SidebarMenuItem className={'group-data-[collapsible=icon]:w-8'}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            className={
                                'cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!'
                            }
                            size="lg"
                        >
                            <DicebearAvatar seed={session?.user.email} size={32} alt="Account Image" />
                            {isSidebarExpanded && (
                                <>
                                    <span className={'flex-1 truncate'}>{session?.user.name}</span>
                                    <ChevronUp />
                                </>
                            )}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <NotificationBadge
                        node={'accountMenu'}
                        variant={isSidebarExpanded ? 'count' : 'dot'}
                        className={'pointer-events-none absolute -right-1 -top-1 z-10'}
                    />
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="end"
                        side={isSidebarExpanded ? 'bottom' : 'right'}
                        sideOffset={4}
                    >
                        <DropdownMenuItem asChild>
                            <Link className={'flex cursor-pointer items-center gap-2'} href={'/account'}>
                                <User />
                                <span className={'flex-1'}>{tAccount('title')}</span>
                                <NotificationBadge node={'account'} />
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <ChangeTheme />
                        <ChangeLanguage />
                        <DropdownMenuSeparator />
                        <SignOutButton />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
