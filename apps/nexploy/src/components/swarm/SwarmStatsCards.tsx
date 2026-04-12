'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { Server, Crown, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function SwarmStatsCards() {
    const { nodes, isSwarmActive } = useSwarmStore();
    const t = useTranslations('swarm');

    if (!isSwarmActive) {
        return null;
    }

    const managerNodes = nodes.filter((n) => n.role === 'manager');
    const workerNodes = nodes.filter((n) => n.role === 'worker');
    const activeNodes = nodes.filter((n) => n.state === 'ready');

    const stats = [
        {
            title: t('totalNodes'),
            icon: Server,
            value: nodes.length,
            description: `${activeNodes.length} ${t('active')}`,
        },
        {
            title: t('managers'),
            icon: Crown,
            value: managerNodes.length,
            description: `${managerNodes.filter((n) => n.managerStatus?.leader).length} ${t('leader')}`,
        },
        {
            title: t('workers'),
            icon: Users,
            value: workerNodes.length,
            description: `${workerNodes.filter((n) => n.state === 'ready').length} ${t('ready')}`,
        },
    ];

    return (
        <div className="grid gap-4 px-5 md:grid-cols-3">
            {stats.map((stat) => (
                <Card key={stat.title} className="flex flex-col justify-between gap-0 py-6">
                    <CardHeader className="flex flex-row justify-between space-y-0">
                        <CardTitle className="flex h-14 text-sm font-medium">
                            {stat.title}
                        </CardTitle>
                        <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                            <stat.icon className="text-primary size-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-semibold">{stat.value}</div>
                        <p className="text-muted-foreground text-xs">{stat.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
