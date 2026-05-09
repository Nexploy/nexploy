import { Card, CardContent } from '@workspace/ui/components/card';
import { ExternalLink, Network, Pencil, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { Button } from '@workspace/ui/components/button';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { PortForm } from '@/components/docker/container/forms/PortForm';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { PortFormProps } from '@workspace/typescript-interface/docker/docker.port';
import { cn } from '@workspace/ui/lib/utils';
import { useContainerChangesStore } from '@/stores/forms/useContainerChangesStore';
import { CardHeaderWithIcon } from '@/components/CardHeaderWithIcon';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEnvironmentStore } from '@/stores/environment/useEnvironmentStore';

function getPortUrl(port: number) {
    const environment = useEnvironmentStore.getState().getSelectedEnvironment();

    const { hostname } = window.location;
    return `http://${environment?.host ?? hostname}:${port}`;
}

export function CardExposedPorts() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const { openDialog } = useConfirmationDialogStore();
    const portChanges = useContainerChangesStore((state) => state.portChanges);
    const t = useTranslations('docker.containerPorts');

    const handleAddPort = () =>
        openDialog({
            closeOnBackground: true,
            title: t('addTitle'),
            description: t('addDescription'),
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
            title: t('editTitle'),
            description: t('editDescription'),
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

    if (isConnecting) {
        return <Skeleton className={'h-90 flex-1'} />;
    }

    return (
        <Card className={'flex flex-1 flex-col'}>
            <CardHeaderWithIcon icon={Network} title={t('title')} className={'justify-between'}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            className={'size-9 xl:size-fit'}
                            icon={Plus}
                            onClick={handleAddPort}
                        >
                            <span className={'hidden xl:flex'}>{t('addPort')}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className={'flex xl:hidden'}>
                        <span>{t('addPort')}</span>
                    </TooltipContent>
                </Tooltip>
            </CardHeaderWithIcon>
            <CardContent className={'flex flex-col overflow-hidden px-0'}>
                <ScrollAreaWithShadow
                    colorShadow={'from-card via-card/50'}
                    bottomShadow
                    className="h-60 overflow-hidden"
                >
                    <div className={'px-6'}>
                        {container?.network.ports.length || addedPorts.length ? (
                            <div className="grid grid-rows-1 gap-2 md:grid-rows-2 lg:grid-rows-3">
                                {container?.network.ports.map((port, idx) => {
                                    const { isEdited, isDeleted, editedPort } =
                                        getPortChangeStatus(port);
                                    const displayPort = editedPort || port;
                                    const hasPublicPort = displayPort.publicPort != null;

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                'group bg-muted/60 relative flex items-center justify-between gap-2 rounded-md px-3 py-2',
                                            )}
                                        >
                                            <code className="flex items-center gap-2 text-sm leading-none">
                                                {hasPublicPort ? (
                                                    <Link
                                                        href={getPortUrl(displayPort.publicPort!)}
                                                        target="_blank"
                                                        className="text-primary inline-flex items-center gap-1 font-semibold hover:underline"
                                                    >
                                                        {displayPort.publicPort}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground font-semibold">
                                                        —
                                                    </span>
                                                )}
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
                                                <TooltipContent>{t('edit')}</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    );
                                })}

                                {addedPorts.map((change, idx) => {
                                    const effectivePublicPort =
                                        change.publicPort ?? change.privatePort!;

                                    return (
                                        <div
                                            key={`new-${idx}`}
                                            className="group bg-muted/60 relative flex items-center justify-between gap-2 rounded-md px-3 py-2"
                                        >
                                            <code className="flex items-center gap-2 text-sm leading-none">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <a
                                                            href={getPortUrl(effectivePublicPort)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary inline-flex items-center gap-1 font-semibold hover:underline"
                                                        >
                                                            {effectivePublicPort}
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {t('openPort', {
                                                            port: effectivePublicPort,
                                                        })}
                                                    </TooltipContent>
                                                </Tooltip>
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
                                                                    privatePort:
                                                                        change.privatePort!,
                                                                    publicPort: change.publicPort,
                                                                })
                                                            }
                                                        >
                                                            <Pencil />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('edit')}</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="mb-16 flex flex-1 items-center justify-center">
                                <p className="text-muted-foreground text-center">{t('noPorts')}</p>
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
