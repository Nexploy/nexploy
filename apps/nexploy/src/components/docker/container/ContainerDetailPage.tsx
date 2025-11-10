'use client';

import { Activity, Container as IconContainer, FileText, Terminal } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { StatusDocker } from '@/components/docker/StatusDocker';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { CardInfoDetail } from '@/components/docker/container/cards/CardInfoDetail';
import { CardExposedPorts } from '@/components/docker/container/cards/CardExposedPorts';
import { CardProcessExecution } from '@/components/docker/container/cards/CardProcessExecution';
import { CardNetworkConfig } from '@/components/docker/container/cards/CardNetworkConfig';
import { CardVolumes } from '@/components/docker/container/cards/CardVolumes';
import { CardEnv } from '@/components/docker/container/cards/CardEnv';
import { CardLabels } from '@/components/docker/container/cards/CardLabels';
import { CardHealthDetails } from '@/components/docker/container/cards/CardHealthDetails';
import { CardNetworkDetails } from '@/components/docker/container/cards/CardNetworkDetails';
import { CardError } from '@/components/docker/container/cards/CardError';
import { CardInfoContainer } from '@/components/docker/container/cards/CardInfoContainer';
import { ContainerActionButtons } from '@/components/docker/container/actions/ContainerActionButtons';
import { Button } from '@workspace/ui/components/button';
import { ContainerTerminal } from '@/components/docker/container/actions/ContainerTerminal';
import { ContainerAttach } from '@/components/docker/container/actions/ContainerAttach';
import { ButtonGroup } from '@workspace/ui/components/button-group';
import { ContainerLogs } from '@/components/docker/container/actions/logs/ContainerLogs';
import { Skeleton } from '@workspace/ui/components/skeleton';

export function ContainerDetailPage() {
    const container = useContainerStore((state) => state.container);

    return (
        <div className="flex h-full flex-1 flex-col pt-5">
            <div className="flex flex-col gap-5 overflow-hidden">
                <div className="flex gap-3 px-5">
                    <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <IconContainer className="text-primary size-7" />
                    </div>
                    <div className="flex flex-1 flex-col">
                        <div className="flex items-center gap-3">
                            {!container ? (
                                <Skeleton className="h-6 w-40" />
                            ) : (
                                <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                    {container.name}
                                </h1>
                            )}
                            <StatusDocker className="my-1" />
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Détails et informations du conteneur Docker
                        </p>
                    </div>
                </div>

                <ScrollAreaWithShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-8 pb-5">
                        <CardInfoContainer />
                        <div className="space-y-5 px-5">
                            {!container ? (
                                <Skeleton className="h-9 flex-1" />
                            ) : (
                                <div className={'flex justify-between gap-2'}>
                                    <ButtonGroup>
                                        <ContainerLogs>
                                            {({ openLogs }) => (
                                                <Button variant="outline" onClick={openLogs}>
                                                    <FileText className="hidden lg:block" />
                                                    Logs
                                                </Button>
                                            )}
                                        </ContainerLogs>
                                        <Button variant="outline">
                                            <Activity className="hidden lg:block" />
                                            Stats
                                        </Button>
                                        <ContainerTerminal>
                                            {({ openConsole }) => (
                                                <Button variant="outline" onClick={openConsole}>
                                                    <Terminal className="hidden lg:block" />
                                                    Console
                                                </Button>
                                            )}
                                        </ContainerTerminal>
                                        <ContainerAttach>
                                            {({ openAttach }) => (
                                                <Button variant="outline" onClick={openAttach}>
                                                    <Terminal className="hidden lg:block" />
                                                    Attach
                                                </Button>
                                            )}
                                        </ContainerAttach>
                                    </ButtonGroup>
                                    <ContainerActionButtons />
                                </div>
                            )}
                            <CardError />
                            <div className={'flex gap-5'}>
                                <CardInfoDetail />
                                <CardExposedPorts />
                            </div>
                            <CardEnv />
                            <CardVolumes />
                            <CardNetworkDetails />
                            <CardNetworkConfig />
                            <CardProcessExecution />
                            <CardLabels />
                            <CardHealthDetails />
                            {/*<CardExecuteId />*/}
                        </div>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
