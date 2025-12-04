import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@workspace/ui/components/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { ChevronUp, Plug, User } from 'lucide-react';
import Link from 'next/link';
import { getUserSession } from '@/services/auth/auth.service';
import { AvatarDisplay } from '@/components/user/AvatarDisplay';
import { ChangeTheme } from '@/components/sidebar/ChangeTheme';

export async function AccountMenu() {
    const session = await getUserSession();

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className={'py-5'}>
                            <AvatarDisplay seed={session?.user.name ?? ''} />
                            <span className={'truncate'}>{session?.user.name}</span>
                            <ChevronUp className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[var(--radix-dropdown-menu-trigger-width)]"
                        align="end"
                        side="top"
                    >
                        <DropdownMenuItem asChild>
                            <Link
                                className={'flex cursor-pointer items-center gap-2'}
                                href={'/account'}
                            >
                                <User />
                                <span>Account</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link
                                className={'flex cursor-pointer items-center gap-2'}
                                href={'/integrations'}
                            >
                                <Plug />
                                <span>Integrations</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <ChangeTheme />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
