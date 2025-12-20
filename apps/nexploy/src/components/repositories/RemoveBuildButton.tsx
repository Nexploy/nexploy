'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { ComponentProps } from 'react';
import { toast } from 'sonner';
import { onRemoveBuild } from '@/actions/repository/builds/removeBuild.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';

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

    const { executeAsync } = useAction(onRemoveBuild, {
        onSuccess: () => {
            toast.success('Build removed successfully');
            if (onSuccess) onSuccess();
        },
    });

    const handleRemove = () => {
        openAlertDialog({
            title: 'Supprimer le build',
            description:
                'Êtes-vous sûr de vouloir supprimer ce build ? Cette action est irréversible.',
            cancelLabel: 'Annuler',
            actionLabel: 'Supprimer',
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
                Remove
            </DropdownMenuItem>
        );
    }

    return (
        <Button {...props} onClick={handleRemove} variant={'destructive'}>
            <Trash2 />
        </Button>
    );
}
