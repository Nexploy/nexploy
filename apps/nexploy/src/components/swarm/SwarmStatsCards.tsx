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

    return (
        <div className="grid gap-4 px-5 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalNodes')}</CardTitle>
                    <Server className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{nodes.length}</div>
                    <p className="text-muted-foreground text-xs">
                        {activeNodes.length} {t('active')}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('managers')}</CardTitle>
                    <Crown className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{managerNodes.length}</div>
                    <p className="text-muted-foreground text-xs">
                        {managerNodes.filter((n) => n.managerStatus?.leader).length} {t('leader')}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('workers')}</CardTitle>
                    <Users className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{workerNodes.length}</div>
                    <p className="text-muted-foreground text-xs">
                        {workerNodes.filter((n) => n.state === 'ready').length} {t('ready')}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
