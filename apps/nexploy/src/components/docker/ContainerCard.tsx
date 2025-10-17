'use client';

import { ContainerInfo } from 'dockerode';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { DropdownMenu, DropdownMenuTrigger, } from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import { Container, MoreVertical } from 'lucide-react';
import { useTransition } from 'react';
import { Status, StatusIndicator, StatusLabel, StatusProps } from '@workspace/ui/components/kibo-ui/status';
import { ContainerState } from '@workspace/typescript-interface/docker';
import { ContainerDropdownActions } from '@/components/docker/ContainerDropdownActions';

interface ContainerCardProps {
    container: ContainerInfo;
}

const containerStatus: Record<ContainerState, StatusProps['status']> = {
    created: 'offline',
    running: 'online',
    restarting: 'degraded',
    removing: 'maintenance',
    paused: 'maintenance',
    exited: 'offline',
    dead: 'degraded',
};


export function ContainerCard({ container }: ContainerCardProps) {
    const [isPending] = useTransition();

    const containerName = container.Names?.[0]!.replace('/', '');
    const containerState = container.State as ContainerState;

    return (
        <Card className="transition-shadow cursor-pointer duration-300 hover:shadow-xl border rounded-xl">
            <CardHeader className="flex">
                <div className="flex flex-1 truncate items-center gap-3">
                    <div
                        className="flex items-center justify-center size-9 rounded-lg bg-primary/10 shrink-0">
                        <Container className="size-5 text-primary"/>
                    </div>
                    <CardTitle className="truncate text-lg font-semibold">
                        {containerName}
                    </CardTitle>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isPending}>
                            <MoreVertical/>
                        </Button>
                    </DropdownMenuTrigger>
                    <ContainerDropdownActions containerId={container.Id} containerName={containerName}
                                              containerState={containerState}/>
                </DropdownMenu>
            </CardHeader>

            <CardContent className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                    <span>État :</span>
                    <Status
                        className="text-sm"
                        status={containerStatus[containerState] ?? 'offline'}
                        variant="outline"
                    >
                        <StatusIndicator/>
                        <StatusLabel className="font-mono">
                            {containerState}
                        </StatusLabel>
                    </Status>
                </div>

                <div>
                    <span className="font-medium">Image :</span> <span
                    className={'text-muted-foreground'}>{container.Image}</span>
                </div>

                <div>
                    <p className="text-sm font-medium">Ports :</p>
                    {container.Ports?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {container.Ports.map((p, idx) => (
                                <span
                                    key={idx}
                                    className="text-xs text-muted-foreground px-2 py-1 rounded-md"
                                >
                                    {p.PublicPort ?? '—'} → {p.PrivatePort} ({p.Type})
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">
                            Aucun port exposé
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
