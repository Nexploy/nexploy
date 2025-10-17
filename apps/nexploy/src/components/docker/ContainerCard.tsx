'use client';

import { ContainerInfo } from 'dockerode';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { Button } from '@workspace/ui/components/button';
import { Container, Eye, Info, MoreVertical, Play, RotateCw, Square } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Status, StatusIndicator, StatusLabel, StatusProps } from '@workspace/ui/components/kibo-ui/status';
import { useRouter } from 'next/navigation';
import { drinoDocker } from '@/lib/api/drinoDocker';

interface ContainerCardProps {
    container: ContainerInfo;
}

export function ContainerCard({ container }: ContainerCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition(); // transition React 18
    const router = useRouter();

    const handleAction = async (action: 'start' | 'stop' | 'restart') => {
        setIsLoading(true);
        try {
            await drinoDocker.post(`/containers/${container.Id}/${action}`, {}).consume();
            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            console.error(`Erreur lors de l’action ${action}:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    const containerName = container.Names?.[0]?.replace('/', '');
    const isRunning = container.State === 'running';

    const containerStatus: Record<string, StatusProps['status']> = {
        created: 'offline',
        running: 'online',
        restarting: 'degraded',
        removing: 'maintenance',
        paused: 'maintenance',
        exited: 'offline',
        dead: 'degraded',
    };

    return (
        <Card className="transition-shadow cursor-pointer duration-300 hover:shadow-xl border rounded-xl">
            <CardHeader className="flex">
                <div className="flex truncate items-center gap-3">
                    <Container className="w-12 h-12 text-blue-600"/>
                    <CardTitle className="truncate text-lg font-semibold">
                        {containerName}
                    </CardTitle>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isLoading || isPending}>
                            <MoreVertical/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled={isRunning || isLoading}>
                            <Eye/>
                            Ouvrir
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleAction('start')}
                            disabled={isRunning || isLoading}
                        >
                            <Play/>
                            Démarrer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleAction('stop')}
                            disabled={!isRunning || isLoading}
                        >
                            <Square/>
                            Arrêter
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleAction('restart')}
                            disabled={isLoading}
                        >
                            <RotateCw/>
                            Redémarrer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem disabled={isLoading}>
                            <Info/>
                            Info
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>

            <CardContent className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">État :</span>
                    <Status
                        className="text-sm"
                        status={containerStatus[container.State] ?? 'offline'}
                        variant="outline"
                    >
                        <StatusIndicator/>
                        <StatusLabel className="font-mono">
                            {container.State}
                        </StatusLabel>
                    </Status>
                </div>

                <div>
                    <p className="text-gray-600 text-sm">
                        <span className="font-medium">Image :</span> {container.Image}
                    </p>
                </div>

                <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Ports :</p>
                    {container.Ports?.length ? (
                        <div className="flex flex-wrap gap-2">
                            {container.Ports.map((p, idx) => (
                                <span
                                    key={idx}
                                    className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-md"
                                >
                                    {p.PublicPort ?? '—'} → {p.PrivatePort} ({p.Type})
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span className="text-gray-400 text-sm">
                            Aucun port exposé
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
