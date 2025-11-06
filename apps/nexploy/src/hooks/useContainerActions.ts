import { ContainerTool } from '@workspace/typescript-interface/docker/docker.container';
import { Pause, Play, RotateCw, Square, Trash2 } from 'lucide-react';
import { onContainerUnpauseAction } from '@/actions/docker/container/containerUnpause.action';
import { onContainerStartAction } from '@/actions/docker/container/containerStart.action';
import { onContainerStopAction } from '@/actions/docker/container/containerStop.action';
import { onContainerPauseAction } from '@/actions/docker/container/containerPause.action';
import { onContainerRestartAction } from '@/actions/docker/container/containerRestart.action';
import { onContainerRemoveAction } from '@/actions/docker/container/containerRemove.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface UseContainerActionsProps {
    containerId: string;
    containerName: string;
    isPaused: boolean;
}

export function useContainerActions({
    containerId,
    containerName,
    isPaused,
}: UseContainerActionsProps) {
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const containerTools: ContainerTool[] = [
        isPaused
            ? {
                  id: 'unpause',
                  icon: Play,
                  label: 'Reprendre',
                  onClick: () => onContainerUnpauseAction({ containerId }),
                  disabledStates: [],
                  variant: 'outline',
              }
            : {
                  id: 'start',
                  icon: Play,
                  label: 'Démarrer',
                  onClick: () => onContainerStartAction({ containerId }),
                  disabledStates: ['running', 'restarting', 'paused'],
                  variant: 'outline',
              },
        {
            id: 'stop',
            icon: Square,
            label: 'Arrêter',
            onClick: () => onContainerStopAction({ containerId }),
            disabledStates: ['exited', 'created', 'dead'],
            variant: 'outline',
        },
        {
            id: 'pause',
            icon: Pause,
            label: 'Pause',
            onClick: () => onContainerPauseAction({ containerId }),
            disabledStates: ['paused', 'exited', 'dead', 'created'],
            variant: 'outline',
        },
        {
            id: 'restart',
            icon: RotateCw,
            label: 'Redémarrer',
            onClick: () => onContainerRestartAction({ containerId }),
            disabledStates: ['created', 'dead'],
            variant: 'outline',
        },
        {
            id: 'destroy',
            icon: Trash2,
            label: 'Delete',
            onClick: () =>
                new Promise((resolve, reject) => {
                    openAlertDialog({
                        title: 'Remove Images',
                        description: `Are you sure you want to remove ${containerName} container?`,
                        cancelLabel: 'Cancel',
                        actionLabel: 'Remove',
                        onAction: async () => {
                            try {
                                const result = await onContainerRemoveAction({ containerId });
                                resolve(result);
                            } catch (error) {
                                reject(error);
                            }
                        },
                    });
                }),
            separator: true,
            variant: 'destructive',
            disabledStates: [],
        },
    ];

    return containerTools;
}
