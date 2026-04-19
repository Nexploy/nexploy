'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { ComponentProps } from 'react';
import { onRemoveBuild } from '@/actions/repository/builds/removeBuild.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { useTranslations } from 'next-intl';

interface RemoveBuildButtonProps extends ComponentProps<typeof Button> {
    buildId: string;
    mode?: 'button' | 'dropdown';
    onSuccess?: () => void;
}

export function RemoveBuildButton({
    buildId,
    mode = 'button',
    onSuccess,
    ...props
}: RemoveBuildButtonProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const t = useTranslations('repository.builds');
    const tCommon = useTranslations('common');

    const { executeAsync } = useAction(onRemoveBuild);

    const handleRemove = () => {
        openAlertDialog({
            title: t('removeTitle'),
            description: t('removeDescription'),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('delete'),
            onAction: async () => {
                await executeAsync({ buildId });
            },
        });
    };

    if (mode === 'dropdown') {
        return (
            <DropdownMenuItem
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove();
                }}
                className="text-destructive hover:[&_svg:not([class*='text-'])]:text-destructive [&_svg:not([class*='text-'])]:text-destructive focus:text-destructive"
            >
                <Trash2 />
                {t('remove')}
            </DropdownMenuItem>
        );
    }

    return (
        <Button {...props} size={'icon'} onClick={handleRemove} variant={'destructive'}>
            <Trash2 />
        </Button>
    );
}
