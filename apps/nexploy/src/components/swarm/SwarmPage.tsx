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
import { CreateServiceDialog } from './CreateServiceDialog';
import { LeaveSwarmDialog } from './LeaveSwarmDialog';
import { toast } from 'sonner';
import { onSwarmRefreshAction } from '@/actions/docker/swarm/refresh.action';
import { SSEProvider } from '@/providers/SSEProviders';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';

export function SwarmPage() {
    const { isSwarmActive, swarmInfo } = useSwarmStore();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const t = useTranslations('swarm');
    const tNotifications = useTranslations('notifications');

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await onSwarmRefreshAction();
            toast.success(tNotifications('operationSuccess'));
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <SSEProvider connections={['swarm']}>
            <div className="flex h-full flex-1 flex-col gap-5 pt-5">
                <div className="flex justify-between px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Network className="text-primary size-7" />
                        </div>
                        <div className="flex flex-col">
                            <div className={'flex items-center gap-2'}>
                                <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                    {t('title')}
                                </h1>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className={'size-8'}
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                >
                                    <RefreshCw className={cn(isRefreshing ? 'animate-spin' : '')} />
                                </Button>
                            </div>
                            <p className="text-muted-foreground text-sm">
                                {isSwarmActive
                                    ? t('clusterWithNodes', { count: swarmInfo?.totalNodes || 0 })
                                    : t('swarmNotActive')}
                            </p>
                        </div>
                    </div>
                    {isSwarmActive && (
                        <LeaveSwarmDialog
                            isManager={swarmInfo?.isManager}
                            trigger={
                                <Button variant="outline">
                                    <LogOut />
                                    {t('leaveSwarm')}
                                </Button>
                            }
                        />
                    )}
                </div>

                {isSwarmActive ? (
                    <Tabs defaultValue="overview" className="flex flex-1 flex-col">
                        <TabsList className="mx-5 w-fit">
                            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
                            <TabsTrigger value="nodes">{t('nodes')}</TabsTrigger>
                            <TabsTrigger value="services">{t('services')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="mt-6 flex-1 overflow-auto pb-6">
                            <SwarmOverview />
                        </TabsContent>
                        <TabsContent value="nodes" className="mt-6 flex-1 overflow-auto pb-6">
                            <NodesTable />
                        </TabsContent>
                        <TabsContent value="services" className="mt-6 flex-1 overflow-auto pb-6">
                            <div className="mb-4 flex justify-end px-5">
                                <CreateServiceDialog />
                            </div>
                            <ServicesTable />
                        </TabsContent>
                    </Tabs>
                ) : (
                    <SwarmNotActive />
                )}
            </div>
        </SSEProvider>
    );
}
