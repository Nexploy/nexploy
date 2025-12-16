'use client';

import { useAction } from 'next-safe-action/hooks';
import { Button } from '@workspace/ui/components/button';
import { Trash2 } from 'lucide-react';
import { ComponentProps } from 'react';
import { toast } from 'sonner';
import { onRemoveBuild } from '@/actions/repository/builds/removeBuild.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { useRouter } from 'next/navigation';

interface RemoveBuildButtonProps extends ComponentProps<typeof Button> {
    buildId: string;
    mode?: 'button' | 'dropdown';
}

export function RemoveBuildButton({ buildId, mode = 'button', ...props }: RemoveBuildButtonProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const router = useRouter();

    const { executeAsync } = useAction(onRemoveBuild, {
        onSuccess: () => {
            router.back();
            toast.success('Build removed successfully');
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
                className="text-destructive focus:text-destructive"
            >
                <Trash2 className="size-4" />
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
