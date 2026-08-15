'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Activity, Key, Layers, Network } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSwarmServiceStore } from '@/stores/docker/useSwarmServiceStore.ts';
import { Skeleton } from '@workspace/ui/components/skeleton.tsx';

export function ServiceDetailStats() {
    const t = useTranslations('swarm');

    const service = useSwarmServiceStore((s) => s.service);
    const tasks = useSwarmServiceStore((s) => s.tasks);
    const isConnecting = useSwarmServiceStore((s) => s.isConnecting);

    const runningCount = tasks.filter((t) => t.state === 'running').length;

    if (isConnecting) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className={'h-38 flex-1'} />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-medium text-sm">{t('replicas')}</CardTitle>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <Layers className="size-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="font-bold text-2xl">
                        {service?.mode === 'replicated' ? `${runningCount}/${service?.replicas}` : '—'}
                    </div>
                    <p className="text-muted-foreground text-xs">{t('detail.replicasRunning')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-medium text-sm">{t('tasks')}</CardTitle>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <Activity className="size-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="font-bold text-2xl">{tasks.length}</div>
                    <p className="text-muted-foreground text-xs">{t('detail.totalTasks')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-medium text-sm">{t('ports')}</CardTitle>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <Network className="size-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="font-bold text-2xl">{service?.ports.length}</div>
                    <p className="text-muted-foreground text-xs">{t('detail.publishedPorts')}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="font-medium text-sm">{t('detail.envTitle')}</CardTitle>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                        <Key className="size-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="font-bold text-2xl">{service?.env.length}</div>
                    <p className="text-muted-foreground text-xs">{t('detail.envVariables')}</p>
                </CardContent>
            </Card>
        </div>
    );
}
