import { SidebarMenu, SidebarMenuItem } from '@workspace/ui/components/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { User } from 'lucide-react';
import Link from 'next/link';
import { getUserSession } from '@/services/auth/auth.service';
import { AvatarDisplay } from '@/components/user/AvatarDisplay';
import { ChangeTheme } from '@/components/sidebar/ChangeTheme';
import { ChangeLanguage } from '@/components/sidebar/ChangeLanguage';
import { SignOutButton } from '@/components/account/SignOutButton';
import { getTranslations } from 'next-intl/server';

export async function AccountMenu() {
    const session = await getUserSession();
    const tAccount = await getTranslations('account');

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <AvatarDisplay session={session} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
                        align="start"
                        side="bottom"
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
