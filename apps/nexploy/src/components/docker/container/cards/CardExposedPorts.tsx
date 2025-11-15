import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Network, Pencil, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { PortForm } from '@/components/docker/container/forms/PortForm';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { PortFormProps } from '@workspace/typescript-interface/docker/docker.port';
import { cn } from '@workspace/ui/lib/utils';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';

export function CardExposedPorts() {
    const container = useContainerStore((state) => state.container);
    const { openDialog } = useConfirmationDialogStore();
    const portChanges = useContainerChangesStore((state) => state.portChanges);

    const handleAddPort = () =>
        openDialog({
            closeOnBackground: true,
            title: 'Ajouter un port',
            description:
                'Le conteneur doit être arrêté pour ajouter un port. Il sera recréé avec la nouvelle configuration.',
            props: {
                className: 'sm:max-w-[425px]',
            },
            content: <PortForm mode="add" />,
        });

    const handleEditPort = (
        port: PortFormProps['defaultPort'],
        originalPort?: PortFormProps['defaultPort'],
    ) =>
        openDialog({
            closeOnBackground: true,
            title: 'Modifier un port',
            description:
                'Le conteneur doit être arrêté pour modifier un port. Il sera recréé avec la nouvelle configuration.',
            props: {
                className: 'sm:max-w-[425px]',
            },
            content: <PortForm mode="edit" defaultPort={port} originalPort={originalPort} />,
        });

    const getPortChangeStatus = (port: PortFormProps['defaultPort']) => {
        const editChange = portChanges.find(
            (change) =>
                change.typeAction === 'edit' &&
                change.currentPublicPort === port?.publicPort &&
                change.currentPrivatePort === port?.privatePort &&
                change.currentType === port?.type,
        );

        const deleteChange = portChanges.find(
            (change) =>
                change.typeAction === 'delete' &&
                change.currentPublicPort === port?.publicPort &&
                change.currentPrivatePort === port?.privatePort &&
                change.currentType === port?.type,
        );

        return {
            isEdited: !!editChange,
            isDeleted: !!deleteChange,
            editedPort: editChange
                ? {
                      publicPort: editChange.publicPort!,
                      privatePort: editChange.privatePort!,
                      type: editChange.type!,
                  }
                : null,
        };
    };

    const addedPorts = portChanges.filter((change) => change.typeAction === 'add');

    if (!container) {
        return <Skeleton className={'h-90 flex-1'} />;
    }

    return (
        <Card className={'flex flex-1 flex-col'}>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <div className={'flex items-center gap-3'}>
                        <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                            <Network className="text-primary size-4" />
                        </div>
                        <CardTitle>Ports exposés</CardTitle>
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className={'size-9 xl:size-fit'}
                                icon={Plus}
                                onClick={handleAddPort}
                            >
                                <span className={'hidden xl:flex'}>Add port</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className={'flex xl:hidden'}>
                            <span>Add port</span>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </CardHeader>
            <CardContent className={'flex flex-col overflow-hidden px-0'}>
                <ScrollAreaWithShadow
                    colorShadow={'from-card via-card/50'}
                    bottomShadow
                    className="h-60 overflow-hidden"
                >
                    <div className={'px-6'}>
                        {container.network.ports.length || addedPorts.length ? (
                            <div className="grid grid-rows-1 gap-2 md:grid-rows-2 lg:grid-rows-3">
                                {container.network.ports.map((port, idx) => {
                                    const { isEdited, isDeleted, editedPort } =
                                        getPortChangeStatus(port);
                                    const displayPort = editedPort || port;

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                'group bg-muted/60 relative flex items-center justify-between gap-2 rounded-md px-3 py-2',
                                            )}
                                        >
                                            <code className="flex gap-2 text-sm leading-none">
                                                <span className="font-semibold">
                                                    {displayPort.publicPort ?? '—'}
                                                </span>
                                                <span className="text-muted-foreground">→</span>
                                                <span>{displayPort.privatePort}</span>
                                                <span className="text-muted-foreground">
                                                    ({displayPort.type})
                                                </span>
                                                {isEdited && (
                                                    <span className="text-primary">*</span>
                                                )}
                                                {isDeleted && (
                                                    <span className="text-destructive">-</span>
                                                )}
                                            </code>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={() =>
                                                            handleEditPort(displayPort, port)
                                                        }
                                                    >
                                                        <Pencil />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Modifier</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    );
                                })}

                                {addedPorts.map((change, idx) => (
                                    <div
                                        key={`new-${idx}`}
                                        className="group bg-muted/60 relative flex items-center justify-between gap-2 rounded-md px-3 py-2"
                                    >
                                        <code className="flex gap-2 text-sm leading-none">
                                            <span className="font-semibold">
                                                {change.publicPort}
                                            </span>
                                            <span className="text-muted-foreground">→</span>
                                            <span>{change.privatePort}</span>
                                            <span className="text-muted-foreground">
                                                ({change.type})
                                            </span>
                                            <span className="text-green-500">+</span>
                                        </code>
                                        <div className="flex gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={() =>
                                                            handleEditPort({
                                                                type: change.type!,
                                                                privatePort: change.privatePort!,
                                                                publicPort: change.publicPort!,
                                                            })
                                                        }
                                                    >
                                                        <Pencil />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Modifier</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mb-16 flex flex-1 items-center justify-center">
                                <p className="text-muted-foreground text-center">
                                    Aucun port exposé
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
