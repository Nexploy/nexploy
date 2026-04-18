'use client';

import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@workspace/ui/components/sidebar';
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
import Image from 'next/image';
import { glass } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';

interface AccountMenuClientProps {
    session: Session | null;
}

export function AccountMenuClient({ session }: AccountMenuClientProps) {
    const { isMobile, state } = useSidebar();
    const tAccount = useTranslations('account');

    const avatar = createAvatar(glass, {
        seed: session?.user.name,
        size: 32,
    }).toDataUri();

    const isSidebarExpanded = state === 'expanded' || isMobile;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className={'cursor-pointer'} size="lg">
                            <Image
                                className={'size-fit rounded-md'}
                                src={avatar}
                                width={28}
                                height={28}
                                alt="Account Image"
                            />
                            <span className={'flex-1 truncate'}>{session?.user.name}</span>
                            <ChevronUp />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="end"
                        side={isSidebarExpanded ? 'bottom' : 'right'}
                        sideOffset={4}
                    >
                        <DropdownMenuItem asChild>
                            <Link
                                className={'flex cursor-pointer items-center gap-2'}
                                href={'/account'}
                            >
                                <User />
                                <span>{tAccount('title')}</span>
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
