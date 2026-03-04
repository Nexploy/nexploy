'use client';

import { Activity, Container as IconContainer, FileText, Globe, Terminal } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { CardInfoDetail } from '@/components/docker/container/cards/CardInfoDetail';
import { CardExposedPorts } from '@/components/docker/container/cards/CardExposedPorts';
import { CardProcessExecution } from '@/components/docker/container/cards/CardProcessExecution';
import { CardNetworkConfig } from '@/components/docker/container/cards/CardNetworkConfig';
import { CardVolumes } from '@/components/docker/container/cards/CardVolumes';
import { CardEnv } from '@/components/docker/container/cards/CardEnv';
import { CardHealthDetails } from '@/components/docker/container/cards/CardHealthDetails';
import { CardNetworkDetails } from '@/components/docker/container/cards/CardNetworkDetails';
import { CardError } from '@/components/docker/container/cards/CardError';
import { CardInfoContainer } from '@/components/docker/container/cards/CardInfoContainer';
import { ContainerActionButtons } from '@/components/docker/container/actions/ContainerActionButtons';
import { Button } from '@workspace/ui/components/button';
import { ContainerTerminal } from '@/components/docker/container/actions/ContainerTerminal';
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
import Link from 'next/link';
import { z } from 'zod';
import { ToolbarButton } from '@/components/shared/ToolbarButton';
import { useMemo } from 'react';
import { CardDriverGraph } from '@/components/docker/container/cards/CardDriverGraph';
import { CardSecurity } from '@/components/docker/container/cards/CardSecurity';

const cuidSchema = z.cuid();

export function ContainerDetailPage() {
    const container = useContainerStore((state) => state.container);
    const t = useTranslations('docker.containerDetail');

    const repositoryId = useMemo(() => {
        const fromName = container?.name?.replace(/^nexploy-/, '');
        if (fromName && fromName !== container?.name && cuidSchema.safeParse(fromName).success) {
            return fromName;
        }
        const projectLabel = container?.labels?.['com.docker.compose.project'];
        const fromStack = projectLabel?.replace(/^nexploy-/, '');
        if (fromStack && fromStack !== projectLabel && cuidSchema.safeParse(fromStack).success) {
            return fromStack;
        }
        return null;
    }, [container?.name, container?.labels]);

    return (
        <div className="relative flex h-full flex-1 flex-col gap-5 pt-5">
            <div className="flex items-center gap-3 px-5">
                <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                    <IconContainer className="text-primary size-7" />
                </div>
                <div className="flex flex-1 flex-col">
                    {!container ? (
                        <Skeleton className="h-6 w-40" />
                    ) : (
                        <h1 className="truncate text-3xl leading-none font-semibold tracking-tight">
                            {container.name}
                        </h1>
                    )}
                    <p className="text-muted-foreground text-sm">{t('description')}</p>
                </div>
                <ApplyChangesButtonForm />
            </div>
            <ScrollAreaWithShadow className="h-full overflow-hidden">
                <div className="flex flex-col gap-8 pb-5">
                    <CardInfoContainer />
                    <div className="space-y-5 px-5">
                        {!container ? (
                            <Skeleton className="h-9 flex-1" />
                        ) : (
                            <div className={'flex flex-col gap-2 sm:flex-row sm:justify-between'}>
                                <ButtonGroup>
                                    <ContainerLogs>
                                        {({ openLogs }) => (
                                            <ToolbarButton
                                                icon={FileText}
                                                label={t('logs')}
                                                onClick={openLogs}
                                            />
                                        )}
                                    </ContainerLogs>
                                    <ContainerStats>
                                        {({ openStats }) => (
                                            <ToolbarButton
                                                icon={Activity}
                                                label={t('stats')}
                                                onClick={openStats}
                                            />
                                        )}
                                    </ContainerStats>
                                    <ContainerTerminal>
                                        {({ openConsole }) => (
                                            <ToolbarButton
                                                icon={Terminal}
                                                label={t('console')}
                                                onClick={openConsole}
                                            />
                                        )}
                                    </ContainerTerminal>
                                    <ContainerAttach>
                                        {({ openAttach }) => (
                                            <ToolbarButton
                                                icon={Terminal}
                                                label={t('attach')}
                                                onClick={openAttach}
                                            />
                                        )}
                                    </ContainerAttach>
                                    {repositoryId && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" asChild>
                                                    <Link
                                                        href={`/repositories/${repositoryId}?tab=domain`}
                                                    >
                                                        <Globe />
                                                        <span className="sm:hidden md:block">
                                                            {t('domains')}
                                                        </span>
                                                    </Link>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="hidden sm:block md:hidden">
                                                {t('domains')}
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </ButtonGroup>
                                <ContainerActionButtons />
                            </div>
                        )}
                        <CardError />
                        <div className={'flex flex-col gap-5 md:flex-row'}>
                            <CardInfoDetail />
                            <CardExposedPorts />
                        </div>
                        <CardEnv />
                        <CardVolumes />
                        <CardNetworkDetails />
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
    );
}
