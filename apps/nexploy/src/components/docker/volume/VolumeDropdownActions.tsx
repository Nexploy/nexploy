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
    tooltipContent?: string;
}

export function VolumeDropdownActions({ volume }: VolumeDropdownActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const t = useTranslations('docker.dropdownActions');

    const volumeName = volume.name || '<none>';
    const isBuiltin = volumeName.startsWith('docker_');

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
            disabled: isBuiltin || (volume.usageData?.RefCount || 0) > 0,
            variant: 'destructive',
            tooltipContent: isBuiltin
                ? t('volume.cannotRemoveSystem')
                : (volume.usageData?.RefCount || 0) > 0
                  ? t('volume.disconnectContainersFirst')
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
