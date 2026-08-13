'use client';

import * as React from 'react';
import { MouseEvent, useState } from 'react';
import { ContainerCard } from '@/components/docker/containers/ContainerCard';
import { Layers, Play, RotateCw, Square } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { ProtectedAction } from '@/components/permission/ProtectedAction';
import { Separator } from '@workspace/ui/components/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@workspace/ui/components/accordion';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { onComposesAction } from '@/actions/docker/composes/composeAction';
import { ComposesAction } from '@workspace/typescript-interface/docker/docker.composeStack';
import { Containers } from '@workspace/typescript-interface/docker/docker.containers';
import { StackDropdownActions } from '@/components/docker/containers/StackDropdownActions';
import { useTranslations } from 'next-intl';

interface StackGroupProps {
    stackName: string;
    containers: Containers[];
}

export function StackGroup({ stackName, containers }: StackGroupProps) {
    const [isLoading, setIsloading] = useState(false);
    const t = useTranslations('common');

    const runningCount = containers.filter((c) => c.state === 'running').length;
    const stoppedCount = containers.filter((c) => c.state === 'exited').length;
    const hasRunning = runningCount > 0;
    const allRunning = runningCount === containers.length;

    const handleAction = async (action: ComposesAction, event: MouseEvent) => {
        event.stopPropagation();

        setIsloading(true);
        await onComposesAction({ stackName, action });
        setIsloading(false);
    };

    return (
        <Accordion type="single" collapsible defaultValue={stackName}>
            <AccordionItem value={stackName} className="bg-card rounded-lg border border-b!">
                <AccordionTrigger
                    position={'left'}
                    classNameChevron={'size-5'}
                    headerChildren={
                        <div className="flex items-center gap-3 pr-5">
                            <Status status={allRunning ? 'online' : 'offline'}>
                                <StatusIndicator />
                                <StatusLabel>{allRunning ? t('up') : t('down')}</StatusLabel>
                            </Status>

                            <Separator orientation="vertical" className="h-6!" />

                            <div className="flex items-center gap-2">
                                <ProtectedAction action="container.lifecycle">
                                    <Button
                                        onClick={(e) => handleAction('start', e)}
                                        disabled={isLoading || allRunning}
                                        isLoading={isLoading}
                                        variant={'outline'}
                                        icon={Play}
                                        size="icon"
                                    >
                                        <span className="sr-only">{t('start')}</span>
                                    </Button>
                                </ProtectedAction>

                                <ProtectedAction action="container.lifecycle">
                                    <Button
                                        onClick={(e) => handleAction('stop', e)}
                                        disabled={isLoading || !hasRunning}
                                        isLoading={isLoading}
                                        variant={'outline'}
                                        icon={Square}
                                        size="icon"
                                    >
                                        <span className="sr-only">{t('stop')}</span>
                                    </Button>
                                </ProtectedAction>

                                <ProtectedAction action="container.lifecycle">
                                    <Button
                                        onClick={(e) => handleAction('restart', e)}
                                        disabled={isLoading || !hasRunning}
                                        isLoading={isLoading}
                                        variant={'outline'}
                                        icon={RotateCw}
                                        size="icon"
                                    >
                                        <span className="sr-only">{t('restart')}</span>
                                    </Button>
                                </ProtectedAction>

                                <Separator orientation="vertical" className="h-6!" />

                                <StackDropdownActions
                                    stackName={stackName}
                                    containerCount={containers.length}
                                    triggerClassName="size-9"
                                />
                            </div>
                        </div>
                    }
                    className="cursor-pointer px-4 hover:no-underline"
                >
                    <div className="flex flex-1 gap-3">
                        <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                            <Layers className="text-primary h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="line-clamp-1 text-base leading-snug font-semibold break-all">{stackName}</h1>
                            <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                <span>
                                    {containers.length} {t('container')}
                                </span>
                                {runningCount > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="text-online font-medium">
                                            {runningCount} {t('active')}
                                        </span>
                                    </>
                                )}
                                {stoppedCount > 0 && (
                                    <>
                                        <span>•</span>
                                        <span className="text-offline">
                                            {stoppedCount} {t('stopped')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </AccordionTrigger>

                <AccordionContent className="bg-muted/40 border-t p-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                        {containers.map((container) => (
                            <ContainerCard key={container.id} container={container} />
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
