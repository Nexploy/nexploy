'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Activity, CheckCircle, Cpu, MemoryStick } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SwarmNode, SwarmTask } from '@workspace/typescript-interface/docker/swarm';
import { formatBytes } from '@/utils/formatBytes';

interface NodeDetailStatsProps {
    node: SwarmNode;
    tasks: SwarmTask[];
}

export function NodeDetailStats({ node, tasks }: NodeDetailStatsProps) {
    const t = useTranslations('swarm');

    const runningTasks = tasks.filter((t) => t.state === 'running').length;
    const cpuCores = node.resources.nanoCPUs / 1e9;
    const memoryBytes = node.resources.memoryBytes;

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('node.cpuCores')}</CardTitle>
                    <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                        <Cpu className="text-primary size-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{cpuCores}</div>
                    <p className="text-muted-foreground text-xs">{t('node.availableCores')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('node.memory')}</CardTitle>
                    <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                        <MemoryStick className="text-primary size-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatBytes(memoryBytes)}</div>
                    <p className="text-muted-foreground text-xs">{t('node.totalMemory')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('tasks')}</CardTitle>
                    <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                        <Activity className="text-primary size-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {runningTasks}/{tasks.length}
                    </div>
                    <p className="text-muted-foreground text-xs">{t('node.tasksRunning')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('status')}</CardTitle>
                    <div className="bg-primary/10 flex size-8 items-center justify-center rounded-lg">
                        <CheckCircle className="text-primary size-4" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold capitalize">{node.state}</div>
                    <p className="text-muted-foreground text-xs capitalize">{node.availability}</p>
                </CardContent>
            </Card>
        </div>
    );
}
