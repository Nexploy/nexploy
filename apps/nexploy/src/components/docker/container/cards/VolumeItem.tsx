import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { DatabaseBackup, Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import type { VolumeItemProps } from '@workspace/typescript-interface/docker/docker.volume';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { TransferVolumeForm } from '@/components/docker/volume/forms/TransferVolumeForm';
import { useProtectionTooltip } from '@/hooks/useProtectionTooltip';

export function VolumeItem({ mount, isNew }: VolumeItemProps) {
    const t = useTranslations('docker.containerVolumes');
    const tTransfer = useTranslations('docker.transferVolume');
    const { volumeChanges, onVolumeChange } = useContainerChangesStore();
    const { openDialog } = useConfirmationDialogStore();
    const volumeProtection = useProtectionTooltip('volume.manage');

    const isDeleted = volumeChanges.some(
        (change) =>
            change.typeAction === 'delete' &&
            change.currentHostPath === mount.source &&
            change.currentContainerPath === mount.destination,
    );

    const handleDelete = () => {
        onVolumeChange({
            typeAction: 'delete',
            currentHostPath: mount.source,
            currentContainerPath: mount.destination,
            currentReadOnly: mount.rw,
        });
    };

    const handleCancelDelete = () => {
        onVolumeChange({
            typeAction: 'add',
            hostPath: mount.source,
            containerPath: mount.destination,
            currentHostPath: mount.source,
            currentContainerPath: mount.destination,
            currentReadOnly: mount.rw,
        });
    };

    const canTransfer = !isNew && !isDeleted && mount.type === 'volume' && !!mount.name;

    const handleTransfer = () => {
        if (!mount.name) return;
        openDialog({
            title: tTransfer('dialogTitle'),
            description: tTransfer('dialogDescription'),
            content: <TransferVolumeForm volumeNames={[mount.name]} />,
        });
    };

    const statusIndicator = isNew ? (
        <span className="text-green-500">+</span>
    ) : isDeleted ? (
        <span className="text-destructive">-</span>
    ) : null;

    return (
        <div className="relative space-y-2 rounded-lg bg-muted/60 p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="rounded bg-primary/20 px-2 py-1 font-medium text-primary text-xs">
                        {mount.type}
                    </span>
                    <span className="rounded bg-secondary px-2 py-1 text-xs">{mount.rw ? 'RW' : 'RO'}</span>
                    <code className="font-medium text-xs">{mount.name ?? mount.source}</code>
                    {statusIndicator}
                </div>
                <div className="flex items-center gap-1">
                    {canTransfer && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    aria-disabled={volumeProtection.blocked}
                                    onClick={volumeProtection.blocked ? undefined : handleTransfer}
                                >
                                    <DatabaseBackup />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{volumeProtection.tooltip ?? tTransfer('transfer')}</TooltipContent>
                        </Tooltip>
                    )}
                    {isDeleted ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelDelete}>
                                    <X />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('cancelDelete')}</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="destructiveGhost"
                                    className="h-6 w-6"
                                    onClick={handleDelete}
                                >
                                    <Trash2 />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t('delete')}</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>
            <div className="space-y-1 text-xs">
                <div className="flex gap-2">
                    <span className="text-muted-foreground">{t('source')}</span>
                    <code className="break-all">{mount.source}</code>
                </div>
                <div className="flex gap-2">
                    <span className="text-muted-foreground">{t('destination')}</span>
                    <code className="break-all">{mount.destination}</code>
                </div>
                {mount.driver && (
                    <div className="flex gap-2">
                        <span className="text-muted-foreground">{t('driver')}</span>
                        <code>{mount.driver}</code>
                    </div>
                )}
            </div>
        </div>
    );
}
