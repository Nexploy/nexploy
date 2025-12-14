'use client';

import { Activity, Clock, Cpu, Download, HardDrive, MemoryStick } from 'lucide-react';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { useMonitoringStore } from '@/stores/monitoring/useMonitoringStore';
import { SSEProvider } from '@/providers/SSEProviders';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@workspace/ui/components/chart';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { formatBytes } from '@/utils/formatBytes';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { Button } from '@workspace/ui/components/button';
import * as React from 'react';
import { useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { refreshRateOptions } from '@/utils/refreshRate';

export default function MonitoringPage() {
    const [refreshRate, setRefreshRate] = useLocalStorage('stats-refreshRate', '5000');
    const { metrics, history, connectionState, exportMetrics } = useMonitoringStore();

    const isLoading = connectionState === 'connecting' || !metrics;

    const chartData = useMemo(
        () =>
            history.map((m) => ({
                timestamp: new Date(m.timestamp).toLocaleTimeString(),
                cpuPercent: m.cpuPercent,
                memoryPercent: m.memoryPercent,
                diskPercent: m.diskPercent,
            })),
        [history],
    );

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };

    const statsCards = [
        {
            title: 'CPU Usage',
            icon: Cpu,
            value: `${metrics?.cpuPercent?.toFixed(1) || 0}%`,
            description: `${metrics?.cpuCount || 0} cores • Load: ${metrics?.loadAverage?.[0]?.toFixed(2) || 0}`,
        },
        {
            title: 'Memory',
            icon: MemoryStick,
            value: `${metrics?.memoryPercent?.toFixed(1) || 0}%`,
            description: `${formatBytes(metrics?.memoryUsed || 0)} / ${formatBytes(metrics?.memoryTotal || 0)}`,
        },
        {
            title: 'Disk',
            icon: HardDrive,
            value: `${metrics?.diskPercent?.toFixed(1) || 0}%`,
            description: `${formatBytes(metrics?.diskUsed || 0)} / ${formatBytes(metrics?.diskTotal || 0)}`,
        },
        {
            title: 'Uptime',
            icon: Clock,
            value: formatUptime(metrics?.uptime || 0),
            description: `${metrics?.hostname || 'Unknown'} • ${metrics?.platform || 'Unknown'}`,
        },
    ];

    const chartCards = [
        {
            title: 'CPU Usage (%)',
            description: 'Real-time CPU percentage over time',
            config: {
                cpuPercent: {
                    label: 'CPU %',
                    color: 'var(--chart-2)',
                },
            },
            areas: [
                {
                    idFill: 'fillCpu',
                    dataKey: 'cpuPercent',
                    fill: 'url(#fillCpu)',
                    color: 'var(--color-cpuPercent)',
                },
            ],
            formatValue: (value: any) => {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                return `${numValue.toFixed(2)}%`;
            },
        },
        {
            title: 'Memory Usage (%)',
            description: 'Real-time memory percentage over time',
            config: {
                memoryPercent: {
                    label: 'Memory %',
                    color: 'var(--chart-2)',
                },
            },
            areas: [
                {
                    idFill: 'fillMemory',
                    dataKey: 'memoryPercent',
                    fill: 'url(#fillMemory)',
                    color: 'var(--color-memoryPercent)',
                },
            ],
            formatValue: (value: any) => {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                return `${numValue.toFixed(2)}%`;
            },
        },
    ];

    return (
        <SSEProvider connections={['monitoring']} params={{ monitoring: { refreshRate } }}>
            <div className="flex h-full flex-1 flex-col gap-5 pt-5">
                <div className="flex justify-between px-5">
                    <div className="flex gap-3">
                        <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-lg">
                            <Activity className="text-primary size-7" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-3xl leading-none font-semibold tracking-tight">
                                Monitoring
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                System metrics and performance
                            </p>
                        </div>
                    </div>
                    <div className={'flex gap-3'}>
                        <Select value={refreshRate} onValueChange={setRefreshRate}>
                            <SelectTrigger>
                                <SelectValue placeholder="refresh rate..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Refresh Rate</SelectLabel>
                                    {refreshRateOptions.map((option, index) => (
                                        <SelectItem key={index} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={exportMetrics}
                            disabled={chartData.length === 0}
                            variant="white"
                            icon={Download}
                            size="sm"
                        >
                            Export CSV
                        </Button>
                    </div>
                </div>

                <ScrollAreaWithShadow bottomShadow className="h-full overflow-hidden">
                    <div className="space-y-4 px-5 pb-5">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {statsCards.map((stat, index) =>
                                isLoading ? (
                                    <Skeleton key={index} className="h-[180px] w-full" />
                                ) : (
                                    <Card
                                        key={index}
                                        className="flex flex-col justify-between gap-0 py-6"
                                    >
                                        <CardHeader className="flex flex-row justify-between space-y-0">
                                            <CardTitle className="flex h-14 text-sm font-medium">
                                                {stat.title}
                                            </CardTitle>
                                            <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-lg">
                                                <stat.icon className="text-primary size-4" />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-semibold">
                                                {stat.value}
                                            </div>
                                            <p className="text-muted-foreground truncate text-xs">
                                                {stat.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ),
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {chartCards.map((chart, index) =>
                                isLoading ? (
                                    <Skeleton key={index} className="h-[300px] w-full" />
                                ) : (
                                    <Card key={index} className="py-4">
                                        <CardHeader className="border-b px-4 !pb-4">
                                            <CardTitle>{chart.title}</CardTitle>
                                            <CardDescription>{chart.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <ChartContainer
                                                config={chart.config as unknown as ChartConfig}
                                                className="h-[250px] w-full"
                                            >
                                                <AreaChart className="w-full" data={chartData}>
                                                    <CartesianGrid vertical={false} />
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                    />
                                                    <ChartTooltip
                                                        content={
                                                            <ChartTooltipContent
                                                                formatter={(value) =>
                                                                    chart.formatValue(value)
                                                                }
                                                            />
                                                        }
                                                    />
                                                    <defs>
                                                        {chart.areas.map((area) => (
                                                            <linearGradient
                                                                key={area.idFill}
                                                                id={area.idFill}
                                                                x1="0"
                                                                y1="0"
                                                                x2="0"
                                                                y2="1"
                                                            >
                                                                <stop
                                                                    offset="5%"
                                                                    stopColor={area.color}
                                                                    stopOpacity={0.8}
                                                                />
                                                                <stop
                                                                    offset="95%"
                                                                    stopColor={area.color}
                                                                    stopOpacity={0.1}
                                                                />
                                                            </linearGradient>
                                                        ))}
                                                    </defs>

                                                    {chart.areas.map((area) => (
                                                        <Area
                                                            key={area.dataKey}
                                                            dataKey={area.dataKey}
                                                            type="bump"
                                                            fill={area.fill}
                                                            fillOpacity={0.4}
                                                            stroke={area.color}
                                                        />
                                                    ))}
                                                </AreaChart>
                                            </ChartContainer>
                                        </CardContent>
                                    </Card>
                                ),
                            )}
                        </div>
                    </div>
                </ScrollAreaWithShadow>
            </div>
        </SSEProvider>
    );
}
