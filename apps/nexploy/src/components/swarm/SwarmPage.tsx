'use client';

import { useState } from 'react';
import { LogOut, Network, RefreshCw } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { SwarmNotActive } from './SwarmNotActive';
import { SwarmOverview } from './SwarmOverview';
import { NodesTable } from './NodesTable';
import { ServicesTable } from './ServicesTable';
import { TasksTable } from './TasksTable';
import { LeaveSwarmDialog } from './LeaveSwarmDialog';
import { toast } from 'sonner';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';
import { SSEProvider } from '@/providers/SSEProviders';

export function SwarmPage() {
    const { isSwarmActive, swarmInfo } = useSwarmStore();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await onSwarmRefreshAction();
            toast.success('Swarm state refreshed');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <SSEProvider connections={['swarm']}>
            <div className="flex h-full flex-1 flex-col gap-5 pt-5">
                <div className="flex items-center justify-between px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Network className="text-primary size-7" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                Docker Swarm
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {isSwarmActive
                                    ? `Cluster with ${swarmInfo?.totalNodes || 0} nodes`
                                    : 'Not in swarm mode'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isSwarmActive && (
                            <LeaveSwarmDialog
                                isManager={swarmInfo?.isManager}
                                trigger={
                                    <Button variant="outline" size="sm">
                                        <LogOut className="mr-2 size-4" />
                                        Leave Swarm
                                    </Button>
                                }
                            />
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {isSwarmActive ? (
                    <Tabs defaultValue="overview" className="flex flex-1 flex-col">
                        <TabsList className="mx-5 w-fit">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="nodes">Nodes</TabsTrigger>
                            <TabsTrigger value="services">Services</TabsTrigger>
                            <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="mt-6 flex-1 overflow-auto pb-6">
                            <SwarmOverview />
                        </TabsContent>
                        <TabsContent value="nodes" className="mt-6 flex-1 overflow-auto pb-6">
                            <NodesTable />
                        </TabsContent>
                        <TabsContent value="services" className="mt-6 flex-1 overflow-auto pb-6">
                            <ServicesTable />
                        </TabsContent>
                        <TabsContent value="tasks" className="mt-6 flex-1 overflow-auto pb-6">
                            <TasksTable />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <SwarmNotActive />
                )}
            </div>
        </SSEProvider>
    );
}
