'use client';

import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Trash2 } from 'lucide-react';
import { onVolumeAction } from '@/actions/docker/volume/volumeAction.action';
import { Volume } from '@workspace/typescript-interface/docker/docker.volume';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

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
    tooltipContent?: string;
}

export function VolumeDropdownActions({ volume }: VolumeDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const volumeName = volume.name || '<none>';
    const isBuiltin = volumeName.startsWith('docker_');

    const handleAction = async (action: 'remove' | 'prune') => {
        await onVolumeAction({ volumeNames: [volumeName], action });
    };

    const volumeTools: VolumeTool[] = [
        {
            icon: Trash2,
            label: 'Supprimer',
            action: () =>
                openAlertDialog({
                    title: 'Supprimer le volume',
                    description: `Êtes-vous sûr de vouloir supprimer le volume "${volumeName}" ?`,
                    cancelLabel: 'Annuler',
                    actionLabel: 'Supprimer',
                    onAction: () => handleAction('remove'),
                }),
            disabled: isBuiltin || (volume.usageData?.RefCount || 0) > 0,
            variant: 'destructive',
            tooltipContent: isBuiltin
                ? 'Impossible de supprimer un volume système'
                : (volume.usageData?.RefCount || 0) > 0
                  ? 'Déconnectez tous les conteneurs utilisant ce volume d’abord'
                  : undefined,
        },
    ];

    return (
        <DropdownMenuContent align="end">
            {volumeTools.map((tool, index) => (
                <Fragment key={index}>
                    {tool.separator && <DropdownMenuSeparator />}
                    {tool.tooltipContent ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <DropdownMenuItem
                                        variant={tool.variant}
                                        onClick={tool.action}
                                        disabled={tool.disabled}
                                    >
                                        <tool.icon />
                                        {tool.label}
                                    </DropdownMenuItem>
                                </div>
                            </TooltipTrigger>
                            {tool.tooltipContent && (
                                <TooltipContent>
                                    <p>{tool.tooltipContent}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    ) : (
                        <DropdownMenuItem
                            variant={tool.variant}
                            onClick={tool.action}
                            disabled={tool.disabled}
                        >
                            <tool.icon />
                            {tool.label}
                        </DropdownMenuItem>
                    )}
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
