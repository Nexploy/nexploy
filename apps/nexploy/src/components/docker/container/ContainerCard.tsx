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
import { Container, ContainerState } from '@workspace/typescript-interface/docker/docker.container';
import { ContainerDropdownActions } from '@/components/docker/container/ContainerDropdownActions';

interface ContainerCardProps {
    container: Container;
}

const containerDisplayState: Record<ContainerState, StatusProps['status']> = {
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

    const containerStatus = container.status;

    return (
        <Card className="relative cursor-pointer rounded-xl border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
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

            <Status
                className={'bg-card absolute -top-2 -right-2 truncate rounded-md'}
                status={containerDisplayState[containerState] ?? 'offline'}
                variant="outline"
            >
                <StatusIndicator />
                <StatusLabel className="truncate font-mono">{containerStatus}</StatusLabel>
            </Status>

            <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2 truncate">
                    <span className="font-medium">Image :</span>
                    <code className="bg-muted/50 truncate rounded-md px-3 py-1 text-sm">
                        {container.image}
                    </code>
                </div>

                <div>
                    <p className="mb-2 font-medium">Ports exposés :</p>
                    {container.ports.length ? (
                        <div className="grid grid-cols-1 gap-2">
                            {container.ports.map((p, idx) => (
                                <code
                                    key={idx}
                                    className="bg-muted/50 flex gap-2 rounded-md px-3 py-2 text-start text-xs leading-none"
                                >
                                    {p.publicPort ?? '—'} → {p.privatePort}
                                    <span className="text-muted-foreground">({p.type})</span>
                                </code>
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
