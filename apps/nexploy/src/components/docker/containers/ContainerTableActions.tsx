'use client';

import { useTranslations } from 'next-intl';
import { Play, RotateCw, Square, Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Switch } from '@workspace/ui/components/switch';
import { useAction } from 'next-safe-action/hooks';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { onContainerStartAction } from '@/actions/docker/container/containerStart.action';
import { onContainerStopAction } from '@/actions/docker/container/containerStop.action';
import { onContainerRestartAction } from '@/actions/docker/container/containerRestart.action';
import { onContainerRemoveAction } from '@/actions/docker/container/containerRemove.action';
import { ContainerTableRow } from './containerTableUtils';
import { Badge } from '@workspace/ui/components/badge.tsx';
import React, { useRef } from 'react';
import { usePermissions } from '@/contexts/PermissionContext';

interface ContainerTableActionsProps {
    selectedContainers: ContainerTableRow[];
    onResetSelection: () => void;
}

export function ContainerTableActions({
    selectedContainers,
    onResetSelection,
}: ContainerTableActionsProps) {
    const { can } = usePermissions();
    const t = useTranslations('docker.tables');
    if (!can('container', 'manage')) return null;
    const tActions = useTranslations('docker.containerActions');
    const tCommon = useTranslations('common');
    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    const { executeAsync: startAsync, isPending: isStarting } = useAction(onContainerStartAction);
    const { executeAsync: stopAsync, isPending: isStopping } = useAction(onContainerStopAction);
    const { executeAsync: restartAsync, isPending: isRestarting } =
        useAction(onContainerRestartAction);
    const { executeAsync: removeAsync, isPending: isRemoving } = useAction(onContainerRemoveAction);

    const isAnyLoading = isStarting || isStopping || isRestarting || isRemoving;
    const numberOfSelectedRows = selectedContainers.length;

    const canStart = selectedContainers.some(
        (c) => !['running', 'restarting', 'paused'].includes(c.state ?? ''),
    );
    const canStop = selectedContainers.some((c) => c.state === 'running');
    const canRestart = selectedContainers.some((c) => c.state === 'running');

    const handleStart = async () => {
        const containerIds = selectedContainers
            .filter((c) => !['running', 'restarting', 'paused'].includes(c.state ?? ''))
            .map((c) => c.id);
        if (containerIds.length) await startAsync({ containerIds });
        onResetSelection();
    };

    const handleStop = async () => {
        const containerIds = selectedContainers
            .filter((c) => c.state === 'running')
            .map((c) => c.id);
        if (containerIds.length) await stopAsync({ containerIds });
        onResetSelection();
    };

    const handleRestart = async () => {
        const containerIds = selectedContainers
            .filter((c) => c.state === 'running')
            .map((c) => c.id);
        if (containerIds.length) await restartAsync({ containerIds });
        onResetSelection();
    };

    const forceRef = useRef(false);

    const handleRemove = () => {
        forceRef.current = false;
        openAlertDialog({
            title: t('removeContainers'),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('remove'),
            description: (
                <div className={'space-y-4'}>
                    <p>{t('confirmRemoveContainers', { count: numberOfSelectedRows })}</p>
                    <label
                        htmlFor={'force-remove'}
                        className={
                            'bg-muted/50 border-destructive flex cursor-pointer items-center justify-between rounded-lg border p-3'
                        }
                    >
                        <div className={'space-y-0.5'}>
                            <p className={'text-destructive text-sm font-medium'}>
                                {t('forceRemove')}
                            </p>
                            <p className={'text-xs'}>{t('forceRemoveDescription')}</p>
                        </div>
                        <Switch
                            id={'force-remove'}
                            className={'data-[state=checked]:bg-destructive!'}
                            onCheckedChange={(checked) => (forceRef.current = checked)}
                        />
                    </label>
                </div>
            ),
            onAction: async () => {
                const containerIds = selectedContainers.map((c) => c.id);
                if (containerIds.length)
                    await removeAsync({ containerIds, force: forceRef.current });
                onResetSelection();
            },
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                icon={Play}
                onClick={handleStart}
                disabled={!canStart || isAnyLoading}
                isLoading={isStarting}
            >
                {tActions('start')}
                {numberOfSelectedRows > 1 && (
                    <Badge variant={'secondary'} className={'rounded-full'}>
                        {numberOfSelectedRows}
                    </Badge>
                )}
            </Button>
            <Button
                variant="outline"
                icon={Square}
                onClick={handleStop}
                disabled={!canStop || isAnyLoading}
                isLoading={isStopping}
            >
                {tActions('stop')}
                {numberOfSelectedRows > 1 && (
                    <Badge variant={'secondary'} className={'rounded-full'}>
                        {numberOfSelectedRows}
                    </Badge>
                )}
            </Button>
            <Button
                variant="outline"
                icon={RotateCw}
                onClick={handleRestart}
                disabled={!canRestart || isAnyLoading}
                isLoading={isRestarting}
            >
                {tActions('restart')}
                {numberOfSelectedRows > 1 && (
                    <Badge variant={'secondary'} className={'rounded-full'}>
                        {numberOfSelectedRows}
                    </Badge>
                )}
            </Button>
            <Button
                variant="destructive"
                icon={Trash2}
                onClick={handleRemove}
                disabled={numberOfSelectedRows === 0 || isAnyLoading}
                isLoading={isRemoving}
            >
                {tCommon('remove')}
                {numberOfSelectedRows > 1 && (
                    <Badge variant={'secondary'} className={'rounded-full'}>
                        {numberOfSelectedRows}
                    </Badge>
                )}
            </Button>
        </div>
    );
}
