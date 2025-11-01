'use client';

import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { Trash2 } from 'lucide-react';
import { onVolumeAction } from '@/actions/docker/volume/volumeAction.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface VolumeDropdownActionsProps {
    volume: Volume;
}

export function VolumeDropdownActions({ volume }: VolumeDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const handleRemove = () => {
        openAlertDialog({
            title: 'Supprimer le volume',
            description: `Êtes-vous sûr de vouloir supprimer le volume "${volume.name}" ?`,
            cancelLabel: 'Annuler',
            actionLabel: 'Supprimer',
            onAction: async () => {
                await onVolumeAction({ volumeNames: [volume.name], action: 'remove' });
            },
        });
    };

    return (
        <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRemove} className="text-destructive">
                <Trash2 />
                <span>Supprimer</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    );
}
