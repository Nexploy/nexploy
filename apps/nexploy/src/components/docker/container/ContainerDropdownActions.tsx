import { Fragment } from 'react';
import {
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from '@workspace/ui/components/dropdown-menu';
import { ContainerState, ContainerTool } from '@workspace/typescript-interface/docker.container';
import { Eye, Pause, Play, RotateCw, Square, Trash2 } from 'lucide-react';
import { onContainerPauseAction } from '@/actions/docker/container/containerPause.action';
import { onContainerUnpauseAction } from '@/actions/docker/container/containerUnpause.action';
import { onContainerStopAction } from '@/actions/docker/container/containerStop.action';
import { onContainerStartAction } from '@/actions/docker/container/containerStart.action';
import { onContainerRestartAction } from '@/actions/docker/container/containerRestart.action';
import { onContainerRemoveAction } from '@/actions/docker/container/containerRemove.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface ContainerDropdownActionsProps {
    containerId: string;
    containerName: string;
    containerState: ContainerState;
}

export function ContainerDropdownActions({
    containerId,
    containerName,
    containerState,
}: ContainerDropdownActionsProps) {
    const isPaused = containerState === 'paused';
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const containerTools: ContainerTool[] = [
        {
            icon: Eye,
            label: 'Ouvrir',
            disabledStates: [],
        },
        isPaused
            ? {
                  icon: Play,
                  label: 'Reprendre',
                  action: async () => await onContainerUnpauseAction({ containerId }),
                  disabledStates: [],
              }
            : {
                  icon: Play,
                  label: 'Démarrer',
                  action: async () => await onContainerStartAction({ containerId }),
                  disabledStates: ['running', 'restarting', 'paused'],
              },
        {
            icon: Square,
            label: 'Arrêter',
            action: async () => await onContainerStopAction({ containerId }),
            disabledStates: ['exited', 'created', 'dead'],
        },
        {
            icon: Pause,
            label: 'Pause',
            action: async () => await onContainerPauseAction({ containerId }),
            disabledStates: ['paused', 'exited', 'dead', 'created'],
        },
        {
            icon: RotateCw,
            label: 'Redémarrer',
            action: async () => await onContainerRestartAction({ containerId }),
            disabledStates: ['created', 'dead'],
        },
        {
            icon: Trash2,
            label: 'Delete',
            action: async () =>
                openAlertDialog({
                    title: 'Remove Images',
                    description: `Are you sure you want to remove ${containerName} container?`,
                    cancelLabel: 'Cancel',
                    actionLabel: 'Remove',
                    onAction: async () => await onContainerRemoveAction({ containerId }),
                }),
            separator: true,
            variant: 'destructive',
            disabledStates: [],
        },
    ];

    return (
        <DropdownMenuContent align="end">
            {containerTools.map((tool, index) => (
                <Fragment key={index}>
                    {tool.separator && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                        variant={tool.variant}
                        onClick={tool.action}
                        disabled={tool.disabledStates.includes(containerState)}
                    >
                        <tool.icon />
                        {tool.label}
                    </DropdownMenuItem>
                </Fragment>
            ))}
        </DropdownMenuContent>
    );
}
