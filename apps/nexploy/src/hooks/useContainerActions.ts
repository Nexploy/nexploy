import { ContainerTool } from '@workspace/typescript-interface/docker/docker.container';
import { Pause, Play, RotateCw, Square, Trash2 } from 'lucide-react';
import { onContainerUnpauseAction } from '@/actions/docker/container/containerUnpause.action';
import { onContainerStartAction } from '@/actions/docker/container/containerStart.action';
import { onContainerStopAction } from '@/actions/docker/container/containerStop.action';
import { onContainerPauseAction } from '@/actions/docker/container/containerPause.action';
import { onContainerRestartAction } from '@/actions/docker/container/containerRestart.action';
import { onContainerRemoveAction } from '@/actions/docker/container/containerRemove.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('docker.containerActions');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);

    const containerTools: ContainerTool[] = [
        isPaused
            ? {
                  id: 'unpause',
                  icon: Play,
                  label: t('resume'),
                  onClick: () => onContainerUnpauseAction({ containerIds: [containerId] }),
                  disabledStates: [],
                  variant: 'outline',
              }
            : {
                  id: 'start',
                  icon: Play,
                  label: t('start'),
                  onClick: () => onContainerStartAction({ containerIds: [containerId] }),
                  disabledStates: ['running', 'restarting', 'paused'],
                  variant: 'outline',
              },
        {
            id: 'stop',
            icon: Square,
            label: t('stop'),
            onClick: () => onContainerStopAction({ containerIds: [containerId] }),
            disabledStates: ['exited', 'created', 'dead'],
            variant: 'outline',
        },
        {
            id: 'pause',
            icon: Pause,
            label: t('pause'),
            onClick: () => onContainerPauseAction({ containerIds: [containerId] }),
            disabledStates: ['paused', 'exited', 'dead', 'created'],
            variant: 'outline',
        },
        {
            id: 'restart',
            icon: RotateCw,
            label: t('restart'),
            onClick: () => onContainerRestartAction({ containerIds: [containerId] }),
            disabledStates: ['created', 'dead'],
            variant: 'outline',
        },
        {
            id: 'destroy',
            icon: Trash2,
            label: t('delete'),
            onClick: () =>
                new Promise((resolve, reject) => {
                    openAlertDialog({
                        title: t('removeTitle'),
                        description: t('removeDescription', { name: containerName }),
                        cancelLabel: t('cancel'),
                        actionLabel: t('remove'),
                        onAction: async () => {
                            try {
                                const result = await onContainerRemoveAction({
                                    containerIds: [containerId],
                                });
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
