import { ContainerTool } from '@workspace/typescript-interface/docker/docker.container';
import { Pause, Play, RotateCw, Square, Trash2 } from 'lucide-react';
import { onContainerUnpauseAction } from '@/actions/docker/container/containerUnpause.action';
import { onContainerStartAction } from '@/actions/docker/container/containerStart.action';
import { onContainerStopAction } from '@/actions/docker/container/containerStop.action';
import { onContainerPauseAction } from '@/actions/docker/container/containerPause.action';
import { onContainerRestartAction } from '@/actions/docker/container/containerRestart.action';
import { onContainerRemoveAction } from '@/actions/docker/container/containerRemove.action';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { Switch } from '@workspace/ui/components/switch';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

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
    const tTables = useTranslations('docker.tables');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const forceRef = useRef(false);

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
                    forceRef.current = false;
                    openAlertDialog({
                        title: t('removeTitle'),
                        description: (
                            <div className={'space-y-4'}>
                                <p>{t('removeDescription', { name: containerName })}</p>
                                <label
                                    htmlFor={'force-remove'}
                                    className={
                                        'bg-muted/50 border-destructive flex cursor-pointer items-center justify-between rounded-lg border p-3'
                                    }
                                >
                                    <div className={'space-y-0.5'}>
                                        <p className={'text-destructive text-sm font-medium'}>
                                            {tTables('forceRemove')}
                                        </p>
                                        <p className={'text-xs'}>
                                            {tTables('forceRemoveDescription')}
                                        </p>
                                    </div>
                                    <Switch
                                        id={'force-remove'}
                                        className={'data-[state=checked]:bg-destructive!'}
                                        onCheckedChange={(checked) => (forceRef.current = checked)}
                                    />
                                </label>
                            </div>
                        ),
                        cancelLabel: t('cancel'),
                        actionLabel: t('remove'),
                        onAction: async () => {
                            try {
                                const result = await onContainerRemoveAction({
                                    containerIds: [containerId],
                                    force: forceRef.current,
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
