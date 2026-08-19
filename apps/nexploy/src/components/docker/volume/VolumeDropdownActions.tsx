'use client';

import { Fragment } from 'react';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@workspace/ui/components/dropdown-menu';
import { ArrowRightLeft, Trash2 } from 'lucide-react';
import { onVolumeAction } from '@/actions/docker/volume/volumeAction.action';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { TransferVolumeForm } from '@/components/docker/volume/forms/TransferVolumeForm';
import { useTranslations } from 'next-intl';
import { ProtectedAction } from '@/components/permission/ProtectedAction';

interface VolumeDropdownActionsProps {
    volume: Volume;
}

interface VolumeTool {
    icon: any;
    label: string;
    action: () => void;
    protection: 'volume.manage' | 'volume.remove';
    disabled?: boolean;
    variant?: 'destructive';
    separator?: boolean;
}

export function VolumeDropdownActions({ volume }: VolumeDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const openDialog = useConfirmationDialogStore((state) => state.openDialog);
    const t = useTranslations('docker.dropdownActions');
    const tTransfer = useTranslations('docker.transferVolume');

    const volumeName = volume.name;

    const handleAction = async (action: 'delete' | 'prune') => {
        await onVolumeAction({ volumeNames: [volumeName], action });
    };

    const volumeTools: VolumeTool[] = [
        {
            icon: ArrowRightLeft,
            label: tTransfer('transfer'),
            protection: 'volume.manage',
            action: () =>
                openDialog({
                    title: tTransfer('dialogTitle'),
                    description: tTransfer('dialogDescription'),
                    content: <TransferVolumeForm volumeNames={[volumeName]} />,
                }),
        },
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
            protection: 'volume.remove',
            variant: 'destructive',
            separator: true,
        },
    ];

    return (
        <DropdownMenuContent align="end">
            {volumeTools.map((tool, index) => (
                <Fragment key={index}>
                    {tool.separator && <DropdownMenuSeparator />}
                    <ProtectedAction action={tool.protection}>
                        <DropdownMenuItem variant={tool.variant} onClick={tool.action}>
                            <tool.icon />
                            {tool.label}
                        </DropdownMenuItem>
                    </ProtectedAction>
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
