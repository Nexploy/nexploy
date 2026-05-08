import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { Trash2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';

export type Mount = {
    type: string;
    source: string;
    destination: string;
    rw: boolean;
    name?: string;
    driver?: string;
};

interface VolumeItemProps {
    mount: Mount;
    isNew?: boolean;
}

export function VolumeItem({ mount, isNew }: VolumeItemProps) {
    const t = useTranslations('docker.containerVolumes');
    const { volumeChanges, onVolumeChange } = useContainerChangesStore();

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

    const statusIndicator = isNew ? (
        <span className="text-green-500">+</span>
    ) : isDeleted ? (
        <span className="text-destructive">-</span>
    ) : null;

    return (
        <div className="bg-muted/60 relative space-y-2 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="bg-primary/20 text-primary rounded px-2 py-1 text-xs font-medium">
                        {mount.type}
                    </span>
                    <span className="bg-secondary rounded px-2 py-1 text-xs">
                        {mount.rw ? 'RW' : 'RO'}
                    </span>
                    <code className="text-xs font-medium">{mount.name ?? mount.source}</code>
                    {statusIndicator}
                </div>
                {isDeleted ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={handleCancelDelete}
                            >
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
