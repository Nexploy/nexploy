'use client';

import { useTranslations } from 'next-intl';
import { Play, RotateCw, Square, Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { useAction } from 'next-safe-action/hooks';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { onContainerStartAction } from '@/actions/docker/container/containerStart.action';
import { onContainerStopAction } from '@/actions/docker/container/containerStop.action';
import { onContainerRestartAction } from '@/actions/docker/container/containerRestart.action';
import { onContainerRemoveAction } from '@/actions/docker/container/containerRemove.action';
import { ContainerTableRow } from './containerTableUtils';

interface ContainerTableActionsProps {
    selectedContainers: ContainerTableRow[];
    onResetSelection: () => void;
}

export function ContainerTableActions({
    selectedContainers,
    onResetSelection,
}: ContainerTableActionsProps) {
    const t = useTranslations('docker.tables');
    const tActions = useTranslations('docker.containerActions');
    const tCommon = useTranslations('common');
    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    const { executeAsync: startAsync, isPending: isStarting } = useAction(onContainerStartAction);
    const { executeAsync: stopAsync, isPending: isStopping } = useAction(onContainerStopAction);
    const { executeAsync: restartAsync, isPending: isRestarting } = useAction(onContainerRestartAction);
    const { executeAsync: removeAsync, isPending: isRemoving } = useAction(onContainerRemoveAction);

    const isAnyLoading = isStarting || isStopping || isRestarting || isRemoving;
    const count = selectedContainers.length;

    const canStart = selectedContainers.some(
        (c) => !['running', 'restarting', 'paused'].includes(c.state ?? ''),
    );
    const canStop = selectedContainers.some((c) => c.state === 'running');
    const canRestart = selectedContainers.some((c) => c.state === 'running');

    const handleStart = async () => {
        const targets = selectedContainers
            .filter((c) => !['running', 'restarting', 'paused'].includes(c.state ?? ''))
            .map((c) => c.id);
        await Promise.all(targets.map((id) => startAsync({ containerId: id })));
        onResetSelection();
    };

    const handleStop = async () => {
        const targets = selectedContainers
            .filter((c) => c.state === 'running')
            .map((c) => c.id);
        await Promise.all(targets.map((id) => stopAsync({ containerId: id })));
        onResetSelection();
    };

    const handleRestart = async () => {
        const targets = selectedContainers
            .filter((c) => c.state === 'running')
            .map((c) => c.id);
        await Promise.all(targets.map((id) => restartAsync({ containerId: id })));
        onResetSelection();
    };

    const handleRemove = () => {
        openAlertDialog({
            title: t('removeContainers'),
            cancelLabel: tCommon('cancel'),
            actionLabel: tCommon('remove'),
            description: t('confirmRemoveContainers', { count }),
            onAction: async () => {
                await Promise.all(
                    selectedContainers.map((c) => removeAsync({ containerId: c.id })),
                );
                onResetSelection();
            },
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
                {count}
            </Badge>
            <Button
                variant="outline"
                icon={Play}
                onClick={handleStart}
                disabled={!canStart || isAnyLoading}
                isLoading={isStarting}
            >
                {tActions('start')}
            </Button>
            <Button
                variant="outline"
                icon={Square}
                onClick={handleStop}
                disabled={!canStop || isAnyLoading}
                isLoading={isStopping}
            >
                {tActions('stop')}
            </Button>
            <Button
                variant="outline"
                icon={RotateCw}
                onClick={handleRestart}
                disabled={!canRestart || isAnyLoading}
                isLoading={isRestarting}
            >
                {tActions('restart')}
            </Button>
            <Button
                variant="destructive"
                icon={Trash2}
                onClick={handleRemove}
                disabled={!count || isAnyLoading}
                isLoading={isRemoving}
            >
                {tCommon('remove')}
            </Button>
        </div>
    );
}
