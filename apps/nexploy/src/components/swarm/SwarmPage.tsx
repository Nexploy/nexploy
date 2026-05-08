'use client';

import { Layers, LayoutDashboard, Network, Plus, Server } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import { Button } from '@workspace/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useSwarmStore } from '@/stores/docker/useSwarmStore';
import { SwarmNotActive } from './SwarmNotActive';
import { SwarmOverview } from './SwarmOverview';
import { NodesTable } from './NodesTable';
import { ServicesTable } from './ServicesTable';
import { LeaveSwarmDialog } from './LeaveSwarmDialog';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function SwarmPage() {
    const { isSwarmActive, swarmInfo, nodes, services } = useSwarmStore();
    const t = useTranslations('swarm');

    return (
        <div className="flex h-full flex-1 flex-col gap-5">
            <div className="flex justify-between gap-2 px-5">
                <div className="flex gap-3">
                    <div className="bg-primary/10 mt-5 flex size-12 shrink-0 items-center justify-center rounded-lg">
                        <Network className="text-primary size-7" />
                    </div>
                    <div className="mt-3.5 flex flex-col">
                        <h1 className="text-3xl font-semibold tracking-tight">{t('title')}</h1>
                        <p className="text-muted-foreground text-sm">
                            {isSwarmActive
                                ? t('clusterWithNodes', { count: swarmInfo?.totalNodes || 0 })
                                : t('swarmNotActive')}
                        </p>
                    </div>
                    {isSwarmActive && <LeaveSwarmDialog />}
                </div>
                {isSwarmActive && (
                    <Button className="mt-5" asChild>
                        <Link href="/swarm/services/create">
                            <Plus />
                            {t('createService.createButton')}
                        </Link>
                    </Button>
                )}
            </div>

            {isSwarmActive ? (
                <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
                    <TabsList className="mx-5 w-fit">
                        <TabsTrigger value="overview" className="flex items-center gap-2">
                            <LayoutDashboard className="size-4" />
                            {t('overview')}
                        </TabsTrigger>
                        <TabsTrigger value="nodes" className="flex items-center gap-2">
                            <Server className="size-4" />
                            {t('nodes')}
                            <Badge variant="secondary" className="rounded-full">
                                {nodes.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="services" className="flex items-center gap-2">
                            <Layers className="size-4" />
                            {t('services')}
                            <Badge variant="secondary" className="rounded-full">
                                {services.length}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                    <ScrollAreaWithShadow className="h-full overflow-hidden">
                        <div className="pb-5">
                            <TabsContent value="overview" className="mt-6">
                                <SwarmOverview />
                            </TabsContent>
                            <TabsContent value="nodes" className="mt-6">
                                <NodesTable />
                            </TabsContent>
                            <TabsContent value="services" className="mt-6">
                                <ServicesTable />
                            </TabsContent>
                        </div>
                    </ScrollAreaWithShadow>
                </Tabs>
            ) : (
                <SwarmNotActive />
            )}
        </div>
    );
}
