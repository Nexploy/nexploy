'use client';

import { Activity, ArrowRightLeft, DatabaseBackup, FileText, PencilLine, Replace, Terminal } from 'lucide-react';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { CardInfoDetail } from '@/components/docker/container/cards/CardInfoDetail';
import { CardExposedPorts } from '@/components/docker/container/cards/CardExposedPorts';
import { CardProcessExecution } from '@/components/docker/container/cards/CardProcessExecution';
import { CardNetworkConfig } from '@/components/docker/container/cards/CardNetworkConfig';
import { CardVolumes } from '@/components/docker/container/cards/CardVolumes';
import { CardEnv } from '@/components/docker/container/cards/CardEnv';
import { CardHealthDetails } from '@/components/docker/container/cards/CardHealthDetails';
import { CardNetworks } from '@/components/docker/container/cards/CardNetworks.tsx';
import { CardError } from '@/components/docker/container/cards/CardError';
import { CardRestartPolicy } from '@/components/docker/container/cards/CardRestartPolicy';
import { CardInfoContainer } from '@/components/docker/container/cards/CardInfoContainer';
import { ContainerActionButtons } from '@/components/docker/container/actions/ContainerActionButtons';
import { ContainerTerminal } from '@/components/docker/container/actions/ContainerTerminal';
import { useProtectionTooltip } from '@/hooks/useProtectionTooltip';
import { ResourceIcon } from '@/components/docker/ResourceIcon';
import { ContainerAttach } from '@/components/docker/container/actions/ContainerAttach';
import { ButtonGroup } from '@workspace/ui/components/button-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { ContainerLogs } from '@/components/docker/container/actions/logs/ContainerLogs';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { ContainerStats } from '@/components/docker/container/actions/ContainerStats';
import { CardExecuteId } from '@/components/docker/container/cards/CardExecuteId';
import { ApplyChangesButtonForm } from '@/components/docker/container/forms/ApplyChangesButtonForm';
import { CardLabels } from '@/components/docker/container/cards/label/CardLabels';
import { useTranslations } from 'next-intl';
import { ToolbarButton } from '@/components/shared/ToolbarButton';
import { CardDriverGraph } from '@/components/docker/container/cards/CardDriverGraph';
import { CardSecurity } from '@/components/docker/container/cards/CardSecurity';
import { useConfirmationDialogStore } from '@/stores/dialogs/useConfirmationDialogStore';
import { RenameContainerForm } from '@/components/docker/container/forms/RenameContainerForm';
import { ChangeImageForm } from '@/components/docker/container/forms/ChangeImageForm';
import { MoveContainerForm } from '@/components/docker/container/forms/MoveContainerForm';
import { TransferVolumeForm } from '@/components/docker/volume/forms/TransferVolumeForm';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider.tsx';
import { NotFoundSSE } from '@/components/shared/NotFoundSSE';
import { Badge } from '@workspace/ui/components/badge.tsx';

export function ContainerDetailPage() {
    const container = useContainerStore((state) => state.container);
    const isConnecting = useContainerStore((state) => state.isConnecting);
    const notFound = useContainerStore((state) => state.notFound);

    const t = useTranslations('docker.containerDetail');
    const tTransfer = useTranslations('docker.transferVolume');
    const { openDialog } = useConfirmationDialogStore();
    const isSwarmContainer = useContainerStore((state) => !!state.container?.labels?.['com.docker.swarm.service.id']);

    const execProtection = useProtectionTooltip('container.exec');
    const updateProtection = useProtectionTooltip('container.update');
    const migrateProtection = useProtectionTooltip('container.migrateOut');
    const volumeProtection = useProtectionTooltip('volume.manage');

    const namedVolumes = (container?.mounts ?? [])
        .filter((mount) => mount.type === 'volume' && !!mount.name)
        .map((mount) => mount.name as string);

    const handleRename = () => {
        if (!container) return;
        openDialog({
            title: t('renameTitle'),
            description: t('renameDescription'),
            content: <RenameContainerForm containerId={container.id} currentName={container.name} />,
        });
    };

    const handleChangeImage = () => {
        if (!container) return;
        openDialog({
            title: t('changeImageTitle'),
            description: t('changeImageDescription'),
            content: <ChangeImageForm containerId={container.id} currentImage={container.image ?? ''} />,
        });
    };

    const handleMoveEnvironment = () => {
        if (!container) return;
        openDialog({
            title: t('moveEnvironmentTitle'),
            description: t('moveEnvironmentDescription'),
            content: <MoveContainerForm containerId={container.id} containerName={container.name} />,
        });
    };

    const handleTransferVolumes = () => {
        if (namedVolumes.length === 0) return;
        openDialog({
            title: tTransfer('dialogTitle'),
            description: tTransfer('dialogDescription'),
            content: <TransferVolumeForm volumeNames={namedVolumes} />,
        });
    };

    if (notFound) {
        return (
            <NotFoundSSE
                title={t('notFoundTitle')}
                description={t('notFoundDescription')}
                backLabel={t('backToContainers')}
            />
        );
    }

    return (
        <BreadcrumbProvider segments={{ containerId: container?.name }}>
            <div className="flex h-full flex-1 flex-col gap-5">
                <div className="flex gap-3 px-5">
                    <ResourceIcon kind="container" name={container?.name} size="lg" className="mt-5" />
                    <div className="mt-3.5 flex flex-1 flex-col">
                        {isConnecting ? (
                            <Skeleton className="h-9 w-40" />
                        ) : isSwarmContainer ? (
                            <h1 className="break-all font-semibold text-3xl tracking-tight">{container?.name}</h1>
                        ) : (
                            <button
                                type="button"
                                onClick={handleRename}
                                className={'group flex cursor-pointer items-center gap-2 self-start'}
                            >
                                <h1 className="break-all font-semibold text-3xl tracking-tight group-hover:underline">
                                    {container?.name}
                                </h1>
                                <PencilLine className={'size-4'} />
                            </button>
                        )}
                        <div className={'flex items-center gap-2'}>
                            <p className="text-muted-foreground text-sm">{t('description')}</p>
                            {isSwarmContainer && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="secondary">{t('swarmManagedBadge')}</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('swarmManagedDescription')}</TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                    <ApplyChangesButtonForm />
                </div>
                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-8 pb-5">
                        <CardInfoContainer />
                        <div className="flex flex-col gap-4 px-5">
                            {isConnecting ? (
                                <Skeleton className="h-9 flex-1" />
                            ) : (
                                <div className={'flex flex-col gap-2 sm:flex-row sm:justify-between'}>
                                    <ButtonGroup>
                                        <ContainerLogs>
                                            {({ openLogs }) => (
                                                <ToolbarButton icon={FileText} label={t('logs')} onClick={openLogs} />
                                            )}
                                        </ContainerLogs>
                                        <ContainerStats>
                                            {({ openStats }) => (
                                                <ToolbarButton icon={Activity} label={t('stats')} onClick={openStats} />
                                            )}
                                        </ContainerStats>
                                        <ContainerTerminal>
                                            {({ openConsole }) => (
                                                <ToolbarButton
                                                    icon={Terminal}
                                                    label={t('console')}
                                                    onClick={openConsole}
                                                    disabled={execProtection.blocked}
                                                    disabledReason={execProtection.tooltip}
                                                />
                                            )}
                                        </ContainerTerminal>
                                        <ContainerAttach>
                                            {({ openAttach }) => (
                                                <ToolbarButton
                                                    icon={Terminal}
                                                    label={t('attach')}
                                                    onClick={openAttach}
                                                    disabled={execProtection.blocked}
                                                    disabledReason={execProtection.tooltip}
                                                />
                                            )}
                                        </ContainerAttach>
                                        {!isSwarmContainer && (
                                            <ToolbarButton
                                                icon={Replace}
                                                label={t('changeImage')}
                                                onClick={handleChangeImage}
                                                disabled={updateProtection.blocked}
                                                disabledReason={updateProtection.tooltip}
                                            />
                                        )}
                                        {!isSwarmContainer && (
                                            <ToolbarButton
                                                icon={ArrowRightLeft}
                                                label={t('moveEnvironment')}
                                                onClick={handleMoveEnvironment}
                                                disabled={migrateProtection.blocked}
                                                disabledReason={migrateProtection.tooltip}
                                            />
                                        )}
                                        {namedVolumes.length > 0 && (
                                            <ToolbarButton
                                                icon={DatabaseBackup}
                                                label={tTransfer('transferContainerVolumes')}
                                                onClick={handleTransferVolumes}
                                                disabled={volumeProtection.blocked}
                                                disabledReason={volumeProtection.tooltip}
                                            />
                                        )}
                                    </ButtonGroup>
                                    <ContainerActionButtons />
                                </div>
                            )}
                            <CardError />
                            <div className={'flex flex-col gap-4 md:flex-row'}>
                                <CardInfoDetail />
                                <CardExposedPorts />
                            </div>
                            <CardRestartPolicy />
                            <CardEnv />
                            <CardVolumes />
                            <CardNetworks />
                            <CardLabels />
                            <CardNetworkConfig />
                            <CardProcessExecution />
                            <CardHealthDetails />
                            <CardExecuteId />
                            <CardSecurity />
                            <CardDriverGraph />
                        </div>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </BreadcrumbProvider>
    );
}
