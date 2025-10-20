'use client';

import * as React from 'react';
import { MouseEvent, useTransition } from 'react';
import { ContainerCard } from '@/components/docker/ContainerCard';
import { ChevronDownIcon, Layers, Loader2, Play, RotateCw, Square } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { useRouter } from 'next/navigation';
import { drinoDocker } from '@/lib/api/drinoDocker';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { Container } from '@workspace/typescript-interface/docker.container';

interface StackGroupProps {
    stackName: string;
    containers: Container[];
}

export function StackGroup({ stackName, containers }: StackGroupProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const runningCount = containers.filter((c) => c.state === 'running').length;
    const stoppedCount = containers.filter((c) => c.state === 'exited').length;
    const hasRunning = runningCount > 0;
    const allRunning = runningCount === containers.length;

    const handleAction = async (action: 'start' | 'stop' | 'restart', event: MouseEvent) => {
        event.stopPropagation();
        try {
            await drinoDocker.post(`/composes/${stackName}/${action}`, {}).consume();
            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            console.error(`Erreur lors de l'action ${action}:`, error);
        }
    };

    return (
        <Accordion type="single" collapsible defaultValue={stackName}>
            <AccordionItem value={stackName} className="bg-card rounded-lg border !border-b">
                <AccordionTrigger asChild className="cursor-pointer px-4 py-4 hover:no-underline">
                    <div className="flex w-full flex-1">
                        <ChevronDownIcon className="text-muted-foreground size-5 self-center transition-transform duration-200" />
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                                <Layers className="text-primary h-5 w-5" />
                            </div>
                            <div className="flex min-w-0 flex-col text-left">
                                <h2 className="truncate text-base font-semibold">{stackName}</h2>
                                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                    <span>{containers.length} conteneur</span>
                                    {runningCount > 0 && (
                                        <>
                                            <span>•</span>
                                            <span className="text-online font-medium">
                                                {runningCount} actif
                                            </span>
                                        </>
                                    )}
                                    {stoppedCount > 0 && (
                                        <>
                                            <span>•</span>
                                            <span className="text-offline">
                                                {stoppedCount} arrêté
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Status className={'mr-2'} status={allRunning ? 'online' : 'offline'}>
                                <StatusIndicator />
                                <StatusLabel>{allRunning ? 'Up' : 'Down'}</StatusLabel>
                            </Status>

                            <Separator orientation="vertical" className="!h-6" />

                            <div className="flex items-center gap-1">
                                <Button
                                    onClick={(e) => handleAction('start', e)}
                                    disabled={isPending || allRunning}
                                    variant="green"
                                    size="icon"
                                >
                                    {isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play />
                                    )}
                                    <span className="sr-only">Démarrer</span>
                                </Button>

                                <Button
                                    onClick={(e) => handleAction('stop', e)}
                                    disabled={isPending || !hasRunning}
                                    variant="red"
                                    size="icon"
                                >
                                    {isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Square className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Arrêter</span>
                                </Button>

                                <Button
                                    onClick={(e) => handleAction('restart', e)}
                                    disabled={isPending || !hasRunning}
                                    variant="blue"
                                    size="icon"
                                >
                                    {isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RotateCw className="h-4 w-4" />
                                    )}
                                    <span className="sr-only">Redémarrer</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                </AccordionTrigger>

                <AccordionContent className="bg-muted/40 border-t p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {containers.map((container) => (
                            <ContainerCard key={container.id} container={container} />
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
