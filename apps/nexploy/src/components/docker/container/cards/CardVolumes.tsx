import { Card, CardContent, CardHeader } from '@workspace/ui/components/card';
import { Database, Plus, Trash2, X } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { VolumeForm } from '@/components/docker/container/forms/VolumeForm';
import { Badge } from '@workspace/ui/components/badge';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';

type Mount = {
    type: string;
    source: string;
    destination: string;
    rw: boolean;
    name?: string;
    driver?: string;
};

interface VolumeItemProps {
    mount: Mount;
    isDeleted: boolean;
    isNew?: boolean;
    displayMount: Mount;
    onDelete: () => void;
    onCancelDelete: () => void;
}

function VolumeItem({ isDeleted, isNew, displayMount, onDelete, onCancelDelete }: VolumeItemProps) {
    const t = useTranslations('docker.containerVolumes');
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
                        {displayMount.type}
                    </span>
                    <span className="bg-secondary rounded px-2 py-1 text-xs">
                        {displayMount.rw ? 'RW' : 'RO'}
                    </span>
                    <code className="text-xs font-medium">
                        {displayMount.name ?? displayMount.source}
                    </code>
                    {statusIndicator}
                </div>
                {isDeleted ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={onCancelDelete}
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
                                onClick={onDelete}
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
                    <code className="break-all">{displayMount.source}</code>
                </div>
                <div className="flex gap-2">
                    <span className="text-muted-foreground">{t('destination')}</span>
                    <code className="break-all">{displayMount.destination}</code>
                </div>
                {displayMount.driver && (
                    <div className="flex gap-2">
                        <span className="text-muted-foreground">{t('driver')}</span>
                        <code>{displayMount.driver}</code>
                    </div>
                )}
            </div>
        </div>
    );
}

export function CardVolumes() {
    const container = useContainerStore((state) => state.container);
    const { openDialog } = useConfirmationDialogStore();
    const { volumeChanges, onVolumeChange } = useContainerChangesStore();
    const t = useTranslations('docker.containerVolumes');

    const handleOpenDialog = () => {
        openDialog({
            closeOnBackground: true,
            title: t('addTitle'),
            description: t('addDescription'),
            props: {
                className: 'sm:max-w-[425px]',
            },
            content: <VolumeForm />,
        });
    };

    const handleDeleteVolume = (source: string, destination: string, readOnly: boolean) => {
        onVolumeChange({
            typeAction: 'delete',
            currentHostPath: source,
            currentContainerPath: destination,
            currentReadOnly: readOnly,
        });
    };

    const handleCancelDelete = (source: string, destination: string, readOnly: boolean) => {
        onVolumeChange({
            typeAction: 'add',
            hostPath: source,
            containerPath: destination,
            currentHostPath: source,
            currentContainerPath: destination,
            currentReadOnly: readOnly,
        });
    };

    const getVolumeChangeStatus = (mount: Mount) => {
        const deleteChange = volumeChanges.find(
            (change) =>
                change.typeAction === 'delete' &&
                change.currentHostPath === mount.source &&
                change.currentContainerPath === mount.destination,
        );

        return {
            isDeleted: !!deleteChange,
        };
    };

    if (!container) {
        return <Skeleton className="h-80 flex-2" />;
    }

    const addedVolumes = volumeChanges.filter((change) => change.typeAction === 'add');
    const hasVolumes = container.mounts.length > 0 || addedVolumes.length > 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <CardHeaderWithIcon as={'div'} icon={Database} title={t('title')}>
                        <Badge variant={'secondary'}>
                            {container.mounts.length + addedVolumes.length}
                        </Badge>
                    </CardHeaderWithIcon>
                    <Button
                        className="size-9 md:size-fit"
                        icon={Plus}
                        onClick={() => handleOpenDialog()}
                    >
                        <span className="hidden md:flex">{t('addVolume')}</span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                {hasVolumes ? (
                    <ScrollAreaWithShadow
                        colorShadow="from-card via-card/50"
                        bottomShadow
                        className="h-70 overflow-hidden px-6"
                    >
                        <div className="space-y-3">
                            {container.mounts.map((mount, idx) => {
                                const { isDeleted } = getVolumeChangeStatus(mount);

                                return (
                                    <VolumeItem
                                        key={idx}
                                        mount={mount}
                                        isDeleted={isDeleted}
                                        displayMount={mount}
                                        onDelete={() =>
                                            handleDeleteVolume(
                                                mount.source,
                                                mount.destination,
                                                mount.rw,
                                            )
                                        }
                                        onCancelDelete={() =>
                                            handleCancelDelete(
                                                mount.source,
                                                mount.destination,
                                                mount.rw,
                                            )
                                        }
                                    />
                                );
                            })}

                            {addedVolumes.map(({ hostPath, containerPath, readOnly }, idx) => {
                                const newMount: Mount = {
                                    type: 'bind',
                                    source: hostPath!,
                                    destination: containerPath!,
                                    rw: !readOnly,
                                };
                                return (
                                    <VolumeItem
                                        key={`new-${idx}`}
                                        mount={newMount}
                                        isDeleted={false}
                                        isNew
                                        displayMount={newMount}
                                        onDelete={() =>
                                            handleDeleteVolume(
                                                newMount.source,
                                                newMount.destination,
                                                newMount.rw,
                                            )
                                        }
                                        onCancelDelete={() =>
                                            handleCancelDelete(
                                                newMount.source,
                                                newMount.destination,
                                                newMount.rw,
                                            )
                                        }
                                    />
                                );
                            })}
                        </div>
                    </ScrollAreaWithShadow>
                ) : (
                    <div className="text-muted-foreground flex h-32 items-center justify-center pb-12 text-sm font-semibold">
                        {t('noVolumes')}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
