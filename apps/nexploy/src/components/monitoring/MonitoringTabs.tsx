'use client';

import { useTranslations } from 'next-intl';
import { Boxes, Server } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Badge } from '@workspace/ui/components/badge';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { useMonitoringStore } from '@/stores/monitoring/useMonitoringStore';
import { useContainersStatsStore } from '@/stores/docker/useContainersStatsStore';
import { DockerEnvironmentGuard } from '@/components/docker/DockerEnvironmentGuard';
import { HostMetricsPanel } from '@/components/monitoring/HostMetricsPanel';
import { ContainersMetricsPanel } from '@/components/monitoring/ContainersMetricsPanel';

export function MonitoringTabs() {
    const t = useTranslations('monitoring');

    const metrics = useMonitoringStore((state) => state.metrics);
    const hostHistory = useMonitoringStore((state) => state.history);
    const hostConnectionState = useMonitoringStore((state) => state.connectionState);

    const containerStats = useContainersStatsStore((state) => state.stats);
    const containerTotals = useContainersStatsStore((state) => state.totals);
    const containerHistory = useContainersStatsStore((state) => state.history);
    const containerTotalsHistory = useContainersStatsStore((state) => state.totalsHistory);
    const containersConnectionState = useContainersStatsStore((state) => state.connectionState);

    const isHostLoading = hostConnectionState === 'connecting' || !metrics;
    const isContainersLoading =
        containersConnectionState !== 'error' && (containersConnectionState !== 'connected' || !containerTotals);

    return (
        <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="mx-5 w-fit">
                <TabsTrigger value="overview" className="gap-2">
                    <Server className="size-4" />
                    {t('tabs.overview')}
                </TabsTrigger>
                <TabsTrigger value="containers" className="gap-2">
                    <Boxes className="size-4" />
                    {t('tabs.containers')}
                    <Badge variant="secondary" className="rounded-full">
                        {containerTotals?.runningCount ?? 0}
                    </Badge>
                </TabsTrigger>
            </TabsList>

            <ScrollAreaWithShadow bottomShadow className="h-full overflow-hidden">
                <div className="px-5 pb-5">
                    <TabsContent value="overview">
                        <HostMetricsPanel metrics={metrics} history={hostHistory} isLoading={isHostLoading} />
                    </TabsContent>
                    <TabsContent value="containers">
                        <DockerEnvironmentGuard>
                            <ContainersMetricsPanel
                                stats={containerStats}
                                totals={containerTotals}
                                history={containerHistory}
                                totalsHistory={containerTotalsHistory}
                                isLoading={isContainersLoading}
                            />
                        </DockerEnvironmentGuard>
                    </TabsContent>
                </div>
            </ScrollAreaWithShadow>
        </Tabs>
    );
}
