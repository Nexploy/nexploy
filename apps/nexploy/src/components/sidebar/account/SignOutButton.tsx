'use client';

import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth/auth-client';
import { useRouter } from '@/i18n/navigation';
import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { cn } from '@workspace/ui/lib/utils';

interface SignInButtonBaseProps {
    children?: ReactNode;
}

type SignInButtonProps<T extends ElementType = typeof DropdownMenuItem> = SignInButtonBaseProps & {
    as?: T;
} & ComponentPropsWithoutRef<T>;

export function SignOutButton<T extends ElementType = typeof DropdownMenuItem>({
    as,
    className,
    children,
    ...props
}: SignInButtonProps<T>) {
    const router = useRouter();

    const Component = as || DropdownMenuItem;

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.refresh();
                },
            },
        });
    };

    return (
        <Component
            className={cn('flex h-9 cursor-pointer items-center gap-2', className)}
            onClick={handleSignOut}
            {...props}
        >
            <LogOut />
            Log Out
        </Component>
    );
}
