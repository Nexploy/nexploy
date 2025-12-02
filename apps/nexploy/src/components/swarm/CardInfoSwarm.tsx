'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { Server, Layers, Users, Crown } from 'lucide-react';

export function CardInfoSwarm() {
    const { nodes, services, swarmInfo, isSwarmActive } = useSwarmStore();

    if (!isSwarmActive) {
        return null;
    }

    const managerNodes = nodes.filter((n) => n.role === 'manager');
    const workerNodes = nodes.filter((n) => n.role === 'worker');
    const activeNodes = nodes.filter((n) => n.status === 'ready');
    const totalReplicas = services.reduce((acc, s) => acc + s.runningReplicas, 0);

    return (
        <div className="grid gap-4 px-5 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
                    <Server className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{nodes.length}</div>
                    <p className="text-muted-foreground text-xs">
                        {activeNodes.length} active
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Manager Nodes</CardTitle>
                    <Crown className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{managerNodes.length}</div>
                    <p className="text-muted-foreground text-xs">
                        {managerNodes.filter((n) => n.managerStatus?.leader).length} leader
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Worker Nodes</CardTitle>
                    <Users className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{workerNodes.length}</div>
                    <p className="text-muted-foreground text-xs">
                        {workerNodes.filter((n) => n.status === 'ready').length} ready
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Services</CardTitle>
                    <Layers className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{services.length}</div>
                    <p className="text-muted-foreground text-xs">
                        {totalReplicas} running replicas
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
