import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@workspace/ui/components/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { ChevronUp, User } from 'lucide-react';
import { getUserSession } from '@/services/auth/auth.service';
import { AvatarDisplay } from '@/components/user/AvatarDisplay';
import { ChangeTheme } from '@/components/sidebar/ChangeTheme';
import Link from 'next/link';
import { SignOutButton } from '@/components/sidebar/account/SignOutButton';

export async function AccountMenu() {
    const session = await getUserSession();

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className={'py-5'}>
                            <AvatarDisplay seed={session?.user.name ?? ''} />{' '}
                            <span className={'truncate'}>{session?.user.name}</span>
                            <ChevronUp className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        <DropdownMenuItem asChild>
                            <Link className={'cursor-pointer'} href={'/account'}>
                                <User />
                                Account
                            </Link>
                        </DropdownMenuItem>
                        <SignOutButton as={DropdownMenuItem} />
                        <DropdownMenuSeparator />
                        <ChangeTheme />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
