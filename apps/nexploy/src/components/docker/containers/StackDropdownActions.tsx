'use client';

import { MouseEvent, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRightLeft, DatabaseBackup, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Switch } from '@workspace/ui/components/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { onComposesAction } from '@/actions/docker/composes/composeAction';
import { MoveStackForm } from '@/components/docker/containers/forms/MoveStackForm';
import { TransferVolumeForm } from '@/components/docker/volume/forms/TransferVolumeForm';
import { useContainersStore } from '@/stores/docker/useContainersStore';
import { COMPOSE_PROJECT_LABEL } from '@nexploy/shared/ownership';
import { useAlertConfirmationDialogStore } from '@/stores/dialogs/useAlertConfirmationDialogStore';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useProtectionTooltip } from '@/hooks/useProtectionTooltip';

interface StackDropdownActionsProps {
    stackName: string;
    containerCount: number;
    triggerClassName?: string;
}

export function StackDropdownActions({ stackName, containerCount, triggerClassName }: StackDropdownActionsProps) {
    const t = useTranslations('common');
    const tDocker = useTranslations('docker');
    const openAlertDialog = useAlertConfirmationDialogStore((state) => state.openAlertDialog);
    const openDialog = useConfirmationDialogStore((state) => state.openDialog);
    const migrateOut = useProtectionTooltip('container.migrateOut');
    const volumeProtection = useProtectionTooltip('volume.manage');
    const containers = useContainersStore((state) => state.containers);

    const stackVolumes = useMemo(() => {
        const names = containers
            .filter((container) => container.labels?.[COMPOSE_PROJECT_LABEL] === stackName)
            .flatMap((container) => container.mounts ?? [])
            .filter((mount) => mount.type === 'volume' && !!mount.name)
            .map((mount) => mount.name as string);

        return [...new Set(names)];
    }, [containers, stackName]);
    const removeProtection = useProtectionTooltip('container.remove');

    const handleMoveEnvironment = () => {
        openDialog({
            title: tDocker('moveStack.dialogTitle'),
            description: tDocker('moveStack.dialogDescription'),
            content: <MoveStackForm stackName={stackName} containerCount={containerCount} />,
        });
    };

    const handleTransferVolumes = () => {
        openDialog({
            title: tDocker('transferVolume.dialogTitle'),
            description: tDocker('transferVolume.dialogDescription'),
            content: <TransferVolumeForm volumeNames={stackVolumes} />,
        });
    };

    const forceRef = useRef(false);

    const handleRemove = () => {
        forceRef.current = false;

        openAlertDialog({
            title: tDocker('stack.removeTitle'),
            description: (
                <div className={'space-y-4'}>
                    <p>{tDocker('stack.removeDescription', { name: stackName })}</p>
                    <label
                        htmlFor={'force-remove-stack'}
                        className={
                            'flex cursor-pointer items-center justify-between rounded-lg border border-destructive bg-muted/50 p-3'
                        }
                    >
                        <div className={'space-y-0.5'}>
                            <p className={'font-medium text-destructive text-sm'}>{tDocker('stack.forceRemove')}</p>
                            <p className={'text-xs'}>{tDocker('stack.forceRemoveDescription')}</p>
                        </div>
                        <Switch
                            id={'force-remove-stack'}
                            className={'data-[state=checked]:bg-destructive!'}
                            onCheckedChange={(checked) => (forceRef.current = checked)}
                        />
                    </label>
                </div>
            ),
            cancelLabel: t('cancel'),
            actionLabel: t('delete'),
            onAction: () => onComposesAction({ stackName, action: 'remove', force: forceRef.current }),
        });
    };

    const renderItem = (
        blocked: boolean,
        tooltip: string | undefined,
        onSelect: () => void,
        icon: typeof ArrowRightLeft,
        label: string,
        variant?: 'destructive',
    ) => {
        const Icon = icon;
        const item = (
            <DropdownMenuItem
                variant={variant}
                disabled={blocked}
                onClick={(event) => {
                    event.stopPropagation();
                    onSelect();
                }}
            >
                <Icon />
                {label}
            </DropdownMenuItem>
        );

        if (!blocked) return item;

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>{item}</div>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
        );
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn('size-8', triggerClassName)}
                    onClick={(event: MouseEvent) => event.stopPropagation()}
                >
                    <MoreVertical />
                    <span className="sr-only">{t('actions')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {renderItem(
                    migrateOut.blocked,
                    migrateOut.tooltip,
                    handleMoveEnvironment,
                    ArrowRightLeft,
                    tDocker('moveStack.move'),
                )}
                {stackVolumes.length > 0 &&
                    renderItem(
                        volumeProtection.blocked,
                        volumeProtection.tooltip,
                        handleTransferVolumes,
                        DatabaseBackup,
                        tDocker('transferVolume.transferStackVolumes'),
                    )}
                <DropdownMenuSeparator />
                {renderItem(
                    removeProtection.blocked,
                    removeProtection.tooltip,
                    handleRemove,
                    Trash2,
                    t('delete'),
                    'destructive',
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
