'use client';

import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { Trash2 } from 'lucide-react';
import { onVolumeAction } from '@/actions/docker/volume/volumeAction.action';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useTranslations } from 'next-intl';

interface VolumeDropdownActionsProps {
    volume: Volume;
}

interface VolumeTool {
    icon: any;
    label: string;
    action: () => void;
    disabled?: boolean;
    variant?: 'destructive';
    separator?: boolean;
}

export function VolumeDropdownActions({ volume }: VolumeDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const t = useTranslations('docker.dropdownActions');

    const volumeName = volume.name || '<none>';

    const handleAction = async (action: 'delete' | 'prune') => {
        await onVolumeAction({ volumeNames: [volumeName], action });
    };

    const volumeTools: VolumeTool[] = [
        {
            icon: Trash2,
            label: t('remove'),
            action: () =>
                openAlertDialog({
                    title: t('volume.removeTitle'),
                    description: t('volume.removeDescription', { name: volumeName }),
                    cancelLabel: t('cancel'),
                    actionLabel: t('remove'),
                    onAction: () => handleAction('delete'),
                }),
            variant: 'destructive',
        },
    ];

    return (
        <DropdownMenuContent align="end">
            {volumeTools.map((tool, index) => (
                <Fragment key={index}>
                    {tool.separator && <DropdownMenuSeparator />}
                    <DropdownMenuItem variant={tool.variant} onClick={tool.action}>
                        <tool.icon />
                        {tool.label}
                    </DropdownMenuItem>
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
