'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Activity, Cpu, MemoryStick, Server } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SwarmNode, SwarmTask } from '@workspace/typescript-interface/docker/swarm';
import { formatBytes } from '@/utils/formatBytes';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Status, StatusIndicator } from '@workspace/ui/components/kibo-ui/status';
import { useSwarmNodeStore } from '@/stores/docker/useSwarmNodeStore.ts';

interface NodeDetailStatsProps {
    node: SwarmNode | null;
    tasks: SwarmTask[];
}

function nodeStateToStatus(state: string): 'online' | 'offline' | 'degraded' | 'waiting' {
    switch (state) {
        case 'ready':
            return 'online';
        case 'down':
            return 'offline';
        case 'disconnected':
            return 'degraded';
        default:
            return 'waiting';
    }
}

export function NodeDetailStats({ node, tasks }: NodeDetailStatsProps) {
    const t = useTranslations('swarm');
    const isConnecting = useSwarmNodeStore((s) => s.isConnecting);

    if (!node || isConnecting) {
        return (
            <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-38 flex-1" />
                ))}
            </div>
        );
    }

    const runningTasks = tasks.filter((task) => task.state === 'running').length;
    const cpuCores = node.resources.nanoCPUs / 1e9;

    const cards = [
        {
            title: t('status'),
            icon: Server,
            render: () => (
                <>
                    <Status
                        className="border-0"
                        status={nodeStateToStatus(node.state)}
                        variant="outline"
                    >
                        <StatusIndicator />
                        <div className="truncate text-2xl font-semibold capitalize">
                            {node.state}
                        </div>
                    </Status>
                    <p className="text-muted-foreground truncate text-xs capitalize">
                        {node.availability}
                    </p>
                </>
            ),
        },
        {
            title: t('node.cpuCores'),
            icon: Cpu,
            render: () => (
                <>
                    <div className="text-2xl font-bold">{cpuCores}</div>
                    <p className="text-muted-foreground truncate text-xs">
                        {t('node.availableCores')}
                    </p>
                </>
            ),
        },
        {
            title: t('node.memory'),
            icon: MemoryStick,
            render: () => (
                <>
                    <div className="text-2xl font-bold">
                        {formatBytes(node.resources.memoryBytes)}
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                        {t('node.totalMemory')}
                    </p>
                </>
            ),
        },
        {
            title: t('tasks'),
            icon: Activity,
            render: () => (
                <>
                    <div className="text-2xl font-bold">
                        {runningTasks}/{tasks.length}
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                        {t('node.tasksRunning')}
                    </p>
                </>
            ),
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 px-5 md:grid-cols-4">
            {cards.map((card, index) => (
                <Card key={index} className="flex flex-col justify-between gap-0 py-6">
                    <CardHeader className="flex flex-row justify-between space-y-0">
                        <CardTitle className="flex h-14 text-sm font-medium">
                            {card.title}
                        </CardTitle>
                        <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                            <card.icon className="text-primary size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>{card.render()}</CardContent>
                </Card>
            ))}
        </div>
    );
}
