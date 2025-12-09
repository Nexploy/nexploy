'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { Server, Crown, Users, Layers, CheckCircle, Clock, XCircle } from 'lucide-react';

export function SwarmStatsCards() {
    const { nodes, services, tasks, isSwarmActive } = useSwarmStore();

    if (!isSwarmActive) {
        return null;
    }

    const managerNodes = nodes.filter((n) => n.role === 'manager');
    const workerNodes = nodes.filter((n) => n.role === 'worker');
    const activeNodes = nodes.filter((n) => n.state === 'ready');

    const runningTasks = tasks.filter((t) => t.state === 'running');
    const pendingTasks = tasks.filter((t) =>
        ['new', 'pending', 'assigned', 'accepted', 'preparing', 'ready', 'starting'].includes(t.state),
    );
    const failedTasks = tasks.filter((t) => t.state === 'failed');

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
                    <p className="text-muted-foreground text-xs">{activeNodes.length} active</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Managers</CardTitle>
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
                    <CardTitle className="text-sm font-medium">Workers</CardTitle>
                    <Users className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{workerNodes.length}</div>
                    <p className="text-muted-foreground text-xs">
                        {workerNodes.filter((n) => n.state === 'ready').length} ready
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
                    <p className="text-muted-foreground text-xs">{totalReplicas} running replicas</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Running Tasks</CardTitle>
                    <CheckCircle className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{runningTasks.length}</div>
                    <p className="text-muted-foreground text-xs">across {nodes.length} nodes</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                    <Clock className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingTasks.length}</div>
                    <p className="text-muted-foreground text-xs">waiting to be scheduled</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed Tasks</CardTitle>
                    <XCircle className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{failedTasks.length}</div>
                    <p className="text-muted-foreground text-xs">need attention</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <Layers className="text-muted-foreground size-4" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{tasks.length}</div>
                    <p className="text-muted-foreground text-xs">in cluster</p>
                </CardContent>
            </Card>
        </div>
    );
}
