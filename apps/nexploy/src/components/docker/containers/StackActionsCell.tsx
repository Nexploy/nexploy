'use client';

import { MouseEvent, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Play, RotateCw, Square, Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { Switch } from '@workspace/ui/components/switch';
import { onComposesAction } from '@/actions/docker/composes/composeAction';
import { ComposesAction } from '@workspace/typescript-interface/docker/docker.composeStack';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';

interface StackActionsCellProps {
    stackName: string;
    runningCount: number;
    totalCount: number;
}

export function StackActionsCell({ stackName, runningCount, totalCount }: StackActionsCellProps) {
    const [isLoading, setIsLoading] = useState(false);
    const t = useTranslations('common');
    const tDocker = useTranslations('docker');
    const openAlertDialog = useAlertConfirmationDialogStore((s) => s.openAlertDialog);

    const hasRunning = runningCount > 0;
    const allRunning = runningCount === totalCount;

    const handleAction = async (action: ComposesAction, event: MouseEvent) => {
        event.stopPropagation();
        setIsLoading(true);
        await onComposesAction({ stackName, action });
        setIsLoading(false);
    };

    const forceRef = useRef(false);

    const handleRemove = (event: MouseEvent) => {
        event.stopPropagation();
        forceRef.current = false;
        openAlertDialog({
            title: tDocker('stack.removeTitle'),
            description: (
                <div className={'space-y-4'}>
                    <p>{tDocker('stack.removeDescription', { name: stackName })}</p>
                    <label
                        htmlFor={'force-remove-stack'}
                        className={
                            'bg-muted/50 border-destructive flex cursor-pointer items-center justify-between rounded-lg border p-3'
                        }
                    >
                        <div className={'space-y-0.5'}>
                            <p className={'text-destructive text-sm font-medium'}>
                                {tDocker('stack.forceRemove')}
                            </p>
                            <p className={'text-xs'}>{tDocker('stack.forceRemoveDescription')}</p>
                        </div>
                        <Switch
                            id={'force-remove-stack'}
                            className={'data-[state=checked]:!bg-destructive'}
                            onCheckedChange={(checked) => (forceRef.current = checked)}
                        />
                    </label>
                </div>
            ),
            cancelLabel: t('cancel'),
            actionLabel: t('delete'),
            onAction: async () => {
                setIsLoading(true);
                await onComposesAction({ stackName, action: 'remove', force: forceRef.current });
                setIsLoading(false);
            },
        });
    };

    return (
        <div className="flex items-center justify-end gap-1">
            <Button
                onClick={(e) => handleAction('start', e)}
                disabled={isLoading || allRunning}
                isLoading={isLoading}
                variant="outline"
                icon={Play}
                size="icon"
                className="size-7"
            >
                <span className="sr-only">Start</span>
            </Button>
            <Button
                onClick={(e) => handleAction('stop', e)}
                disabled={isLoading || !hasRunning}
                isLoading={isLoading}
                variant="outline"
                icon={Square}
                size="icon"
                className="size-7"
            >
                <span className="sr-only">Stop</span>
            </Button>
            <Button
                onClick={(e) => handleAction('restart', e)}
                disabled={isLoading || !hasRunning}
                isLoading={isLoading}
                variant="outline"
                icon={RotateCw}
                size="icon"
                className="size-7"
            >
                <span className="sr-only">Restart</span>
            </Button>
            <Separator orientation="vertical" className="mx-1 !h-5" />
            <Button
                onClick={handleRemove}
                disabled={isLoading}
                isLoading={isLoading}
                variant="destructiveOutline"
                icon={Trash2}
                size="icon"
                className="size-7"
            >
                <span className="sr-only">Remove</span>
            </Button>
        </div>
    );
}
