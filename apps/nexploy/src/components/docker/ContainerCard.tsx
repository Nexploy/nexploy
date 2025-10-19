'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { DropdownMenu, DropdownMenuTrigger } from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import { Container as IconContainer, MoreVertical } from 'lucide-react';
import { useTransition } from 'react';
import {
    Status,
    StatusIndicator,
    StatusLabel,
    StatusProps,
} from '@workspace/ui/components/kibo-ui/status';
import { Container, ContainerState } from '@workspace/typescript-interface/docker';
import { ContainerDropdownActions } from '@/components/docker/ContainerDropdownActions';

interface ContainerCardProps {
    container: Container;
}

const containerStatus: Record<ContainerState, StatusProps['status']> = {
    created: 'offline',
    running: 'online',
    restarting: 'degraded',
    paused: 'maintenance',
    exited: 'offline',
    dead: 'degraded',
};

export function ContainerCard({ container }: ContainerCardProps) {
    const [isPending] = useTransition();

    const containerName = container.name;
    const containerState = container.state;

    return (
        <Card className="cursor-pointer rounded-xl border transition-all duration-300 hover:scale-[1.01] hover:shadow-xl">
            <CardHeader className="flex">
                <div className="flex flex-1 items-center gap-3 truncate">
                    <div className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-lg">
                        <IconContainer className="text-primary size-5" />
                    </div>
                    <CardTitle className="truncate text-lg font-semibold">
                        {containerName}
                    </CardTitle>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isPending}>
                            <MoreVertical />
                        </Button>
                    </DropdownMenuTrigger>
                    <ContainerDropdownActions
                        containerId={container.id}
                        containerName={containerName}
                        containerState={containerState}
                    />
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
                        <StatusIndicator />
                        <StatusLabel className="font-mono">{containerState}</StatusLabel>
                    </Status>
                </div>

                <div>
                    <span className="font-medium">Image :</span>{' '}
                    <span className={'text-muted-foreground'}>{container.image}</span>
                </div>

                <div className={'flex flex-col gap-1'}>
                    <p className="text-sm font-medium">Ports :</p>
                    {container.ports.length ? (
                        <div className="flex flex-col items-start gap-2">
                            {container.ports.map((p, idx) => (
                                <span
                                    key={idx}
                                    className="text-muted-foreground bg-muted rounded-md px-2 py-1 text-xs"
                                >
                                    {p.publicPort ?? '—'} → {p.privatePort} ({p.type}) -{' '}
                                    {p.hostIps.map((hostIp) => `${hostIp} `)}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Aucun port exposé</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
