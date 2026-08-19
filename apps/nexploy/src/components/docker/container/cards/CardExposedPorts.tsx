import { Card, CardContent } from '@workspace/ui/components/card';
import { ChevronDown, Globe, Network, Pencil, Plus, Server, X } from 'lucide-react';
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
import { useEnvironmentStore } from '@/stores/docker/useEnvironmentStore';
import { Can } from '@/components/permission/Can';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { useContainerDomains } from '@/hooks/useContainerDomains';
import type { Domain } from '@workspace/schemas-zod/repository/domain.schema';

function getPortUrl(port: number) {
    const environment = useEnvironmentStore.getState().getSelectedEnvironment();

    const { hostname } = window.location;
    return `http://${environment?.host ?? hostname}:${port}`;
}

function getDomainUrl(domain: Domain) {
    const protocol = domain.https ? 'https' : 'http';
    const path = domain.path && domain.path !== '/' ? domain.path : '';
    return `${protocol}://${domain.host}${path}`;
}

function PortLink({
    publicPort,
    privatePort,
    domains,
}: {
    publicPort: number;
    privatePort: number;
    domains: Domain[];
}) {
    const t = useTranslations('docker.containerPorts');
    const matchingDomains = domains.filter((domain) => domain.containerPort === privatePort);
    const ipUrl = getPortUrl(publicPort);

    console.log(matchingDomains.length);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex cursor-pointer items-center gap-1 font-semibold text-primary">
                {publicPort}
                <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-w-72">
                <DropdownMenuLabel>{t('openWith')}</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <a href={ipUrl} target="_blank" rel="noopener noreferrer">
                        <Server />
                        <span className="truncate">{t('openWithIp')}</span>
                    </a>
                </DropdownMenuItem>
                {matchingDomains.length > 0 && <DropdownMenuSeparator />}
                {matchingDomains.map((domain) => (
                    <DropdownMenuItem key={domain.id ?? domain.host} asChild>
                        <a href={getDomainUrl(domain)} target="_blank" rel="noopener noreferrer">
                            <Globe />
                            <span className="truncate">{domain.host}</span>
                        </a>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function CardExposedPorts() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);

    const { openDialog } = useConfirmationDialogStore();
    const portChanges = useContainerChangesStore((state) => state.portChanges);
    const onPortChange = useContainerChangesStore((state) => state.onPortChange);
    const isSwarmContainer = useContainerStore((state) => !!state.container?.labels?.['com.docker.swarm.service.id']);
    const t = useTranslations('docker.containerPorts');
    const { domains } = useContainerDomains(container?.name);

    const handleAddPort = () =>
        openDialog({
            title: t('addTitle'),
            description: t('addDescription'),
            content: <PortForm mode="add" />,
        });

    const handleEditPort = (port: PortFormProps['defaultPort'], originalPort?: PortFormProps['defaultPort']) =>
        openDialog({
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
                {!isSwarmContainer && (
                    <Can resource={'container'} action={'manage'}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button className={'size-9 xl:size-fit'} icon={Plus} onClick={handleAddPort}>
                                    <span className={'hidden xl:flex'}>{t('addPort')}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className={'flex xl:hidden'}>
                                <span>{t('addPort')}</span>
                            </TooltipContent>
                        </Tooltip>
                    </Can>
                )}
            </CardHeaderWithIcon>
            <CardContent className={'flex flex-col overflow-hidden px-0'}>
                <ScrollAreaWithShadow bottomShadow className="h-60 overflow-hidden">
                    <div className={'px-6'}>
                        {container?.network.ports.length || addedPorts.length ? (
                            <div className="grid grid-rows-1 gap-2 md:grid-rows-2 lg:grid-rows-3">
                                {container?.network.ports.map((port, idx) => {
                                    const { isEdited, isDeleted, editedPort } = getPortChangeStatus(port);
                                    const displayPort = editedPort || port;
                                    const hasPublicPort = displayPort.publicPort != null;

                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                'group relative flex h-9 items-center justify-between gap-2 rounded-md bg-muted/60 px-3 py-2',
                                            )}
                                        >
                                            <code className="flex items-center gap-2 text-sm leading-none">
                                                {hasPublicPort ? (
                                                    <PortLink
                                                        publicPort={displayPort.publicPort!}
                                                        privatePort={displayPort.privatePort}
                                                        domains={domains}
                                                    />
                                                ) : (
                                                    <span className="font-semibold text-muted-foreground">—</span>
                                                )}
                                                <span className="text-muted-foreground">→</span>
                                                <span>{displayPort.privatePort}</span>
                                                <span className="text-muted-foreground">({displayPort.type})</span>
                                                {isEdited && <span className="text-primary">*</span>}
                                                {isDeleted && <span className="text-destructive">-</span>}
                                            </code>
                                            <Can resource={'container'} action={'manage'}>
                                                {!isSwarmContainer &&
                                                    (isDeleted ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6"
                                                                    onClick={() =>
                                                                        onPortChange({
                                                                            typeAction: 'add',
                                                                            publicPort: port.publicPort,
                                                                            privatePort: port.privatePort,
                                                                            type: port.type,
                                                                            currentPublicPort: port.publicPort,
                                                                            currentPrivatePort: port.privatePort,
                                                                            currentType: port.type,
                                                                        })
                                                                    }
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
                                                                    variant="ghost"
                                                                    className="h-6 w-6"
                                                                    onClick={() => handleEditPort(displayPort, port)}
                                                                >
                                                                    <Pencil />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>{t('edit')}</TooltipContent>
                                                        </Tooltip>
                                                    ))}
                                            </Can>
                                        </div>
                                    );
                                })}

                                {addedPorts.map((change, idx) => {
                                    const hasPublicPort = change.publicPort != null;

                                    return (
                                        <div
                                            key={`new-${idx}`}
                                            className="group relative flex items-center justify-between gap-2 rounded-md bg-muted/60 px-3 py-2"
                                        >
                                            <code className="flex items-center gap-2 text-sm leading-none">
                                                {hasPublicPort ? (
                                                    <PortLink
                                                        publicPort={change.publicPort!}
                                                        privatePort={change.privatePort!}
                                                        domains={domains}
                                                    />
                                                ) : (
                                                    <span className="font-semibold text-muted-foreground">—</span>
                                                )}
                                                <span className="text-muted-foreground">→</span>
                                                <span>{change.privatePort}</span>
                                                <span className="text-muted-foreground">({change.type})</span>
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
                                <p className="text-center text-muted-foreground text-sm">{t('noPorts')}</p>
                            </div>
                        )}
                    </div>
                </ScrollAreaWithShadow>
            </CardContent>
        </Card>
    );
}
