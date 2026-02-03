'use client';

import { LogOut } from 'lucide-react';
import { authClient } from '@/lib/auth/auth-client';
import { useRouter } from '@/i18n/navigation';
import { ReactNode } from 'react';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { Button, buttonVariants } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import type { VariantProps } from 'class-variance-authority';

interface SignOutButtonProps {
    children?: ReactNode;
    showIcon?: boolean;
    variant?: 'dropdown' | 'button';
    buttonVariant?: VariantProps<typeof buttonVariants>['variant'];
    buttonSize?: VariantProps<typeof buttonVariants>['size'];
    className?: string;
}

export function SignOutButton({
    className,
    children,
    showIcon = true,
    variant = 'dropdown',
    buttonVariant = 'destructive',
    buttonSize = 'sm',
}: SignOutButtonProps) {
    const router = useRouter();
    const t = useTranslations('account.dangerZone');
    const tCommon = useTranslations('common');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const performSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.refresh();
                },
            },
        });
    };

    const handleSignOut = () => {
        openAlertDialog({
            title: t('signOut'),
            description: t('confirmSignOut'),
            cancelLabel: tCommon('cancel'),
            actionLabel: t('logOut'),
            onAction: performSignOut,
        });
    };

    const content = (
        <>
            {showIcon && <LogOut className="size-4" />}
            {children ?? t('logOut')}
        </>
    );

    if (variant === 'button') {
        return (
            <Button
                variant={buttonVariant}
                size={buttonSize}
                className={cn('flex items-center gap-2', className)}
                onClick={handleSignOut}
            >
                {content}
            </Button>
        );
    }

    return (
        <DropdownMenuItem
            className={cn('flex h-9 cursor-pointer items-center gap-2', className)}
            onClick={handleSignOut}
        >
            {content}
        </DropdownMenuItem>
    );
}
