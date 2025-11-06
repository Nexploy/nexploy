'use client';

import { Container as IconContainer } from 'lucide-react';
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
import { CardDriverGraph } from '@/components/docker/container/cards/CardDriverGraph';
import { CardSecurity } from '@/components/docker/container/cards/CardSecurity';
import { CardExecuteId } from '@/components/docker/container/cards/CardExecuteId';
import { CardError } from '@/components/docker/container/cards/CardError';
import { CardInfoContainer } from '@/components/docker/container/cards/CardInfoContainer';
import { ContainerActionButtons } from '@/components/docker/container/actions/ContainerActionButtons';

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
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                {container?.name}
                            </h1>
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
                            <div className={'flex justify-between'}>
                                {/*<ContainerActionButtons />*/}
                                <ContainerActionButtons />
                            </div>
                            <CardError />
                            <div className={'flex gap-5'}>
                                <CardInfoDetail />
                                <CardExposedPorts />
                            </div>
                            <CardProcessExecution />
                            <CardNetworkConfig />
                            <CardVolumes />
                            <CardEnv />
                            <CardLabels />
                            <CardHealthDetails />
                            <CardNetworkDetails />
                            <CardDriverGraph />
                            <CardSecurity />
                            <CardExecuteId />
                        </div>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </div>
    );
}
