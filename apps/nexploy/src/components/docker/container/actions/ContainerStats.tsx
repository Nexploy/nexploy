'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { Activity, Download } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import * as React from 'react';
import { ReactNode, useState } from 'react';
import { useContainerStore } from '@/stores/docker/useContainerStore';
import { SSEProvider } from '@/providers/SSEProviders';
import { useContainerStatsStore } from '@/stores/docker/useContainerStatsStore';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@workspace/ui/components/chart';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@workspace/ui/components/card';
import { Status, StatusIndicator, StatusLabel } from '@workspace/ui/components/kibo-ui/status';
import { statusMap } from '@/utils/statusMap';
import { Separator } from '@workspace/ui/components/separator';
import { ScrollAreaWithShadow } from '@/components/ScrollAreaWithShadow';
import { formatBytes } from '@/utils/formatBytes';
import { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Skeleton } from '@workspace/ui/components/skeleton';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { useLocalStorage } from 'usehooks-ts';

interface ContainerStatsProps {
    children: (props: { openStats: () => void }) => ReactNode;
}

const refreshRateOptions = [
    { value: '1000', label: '1s' },
    { value: '2000', label: '2s' },
    { value: '5000', label: '5s' },
    { value: '10000', label: '10s' },
];

export function ContainerStats({ children }: ContainerStatsProps) {
    const [open, setOpen] = useState(false);
    const [refreshRate, setRefreshRate] = useLocalStorage('stats-refreshRate', '5000');

    const container = useContainerStore((state) => state.container);
    const { connectionState, history, exportStats, stats } = useContainerStatsStore(
        (state) => state,
    );

    const currentStatus = statusMap[connectionState];

    const handleOpen = async () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const chartData = history.map((stat) => ({
        timestamp: new Date(stat.timestamp).toLocaleTimeString(),
        cpuPercent: stat.cpuPercent,
        memoryUsage: stat.memoryUsage,
        networkRx: stat.networkRx,
        networkTx: stat.networkTx,
        blockRead: stat.blockRead,
        blockWrite: stat.blockWrite,
        memoryPercent: stat.memoryPercent,
        pidsCount: stat.pidsCount,
    }));

    const statsCard = [
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
                    idFill: 'fillCpuPercent',
                    dataKey: 'cpuPercent',
                    fill: 'url(#fillCpuPercent)',
                    color: 'var(--color-cpuPercent)',
                },
            ],
            formatValue: (value: ValueType) => {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                return `CPU ${numValue.toFixed(3)}%`;
            },
        },
        {
            title: 'Memory Usage',
            description: 'Real-time memory usage over time',
            config: {
                memoryUsage: {
                    label: 'Memory',
                    color: 'var(--chart-2)',
                },
            },
            areas: [
                {
                    idFill: 'fillMemoryUsage',
                    dataKey: 'memoryUsage',
                    fill: 'url(#fillMemoryUsage)',
                    color: 'var(--color-memoryUsage)',
                },
            ],
            formatValue: (value: ValueType) => {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                return formatBytes(numValue);
            },
        },
        {
            title: 'Network',
            description: 'Real-time network RX and TX over time',
            config: {
                networkRx: {
                    label: 'RX',
                    color: 'var(--chart-2)',
                },
                networkTx: {
                    label: 'TX',
                    color: 'var(--chart-1)',
                },
            },
            areas: [
                {
                    idFill: 'fillNetworkRx',
                    dataKey: 'networkRx',
                    fill: 'url(#fillNetworkRx)',
                    color: 'var(--color-networkRx)',
                },
                {
                    idFill: 'fillNetworkTx',
                    dataKey: 'networkTx',
                    fill: 'url(#fillNetworkTx)',
                    color: 'var(--color-networkTx)',
                },
            ],
            formatValue: (value: ValueType) => {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                return formatBytes(numValue);
            },
        },
        {
            title: 'Block I/O',
            description: 'Real-time block read and write over time',
            config: {
                blockRead: {
                    label: 'Read',
                    color: 'var(--chart-2)',
                },
                blockWrite: {
                    label: 'Write',
                    color: 'var(--chart-1)',
                },
            },
            areas: [
                {
                    idFill: 'fillBlockRead',
                    dataKey: 'blockRead',
                    fill: 'url(#fillBlockRead)',
                    color: 'var(--color-blockRead)',
                },
                {
                    idFill: 'fillBlockWrite',
                    dataKey: 'blockWrite',
                    fill: 'url(#fillBlockWrite)',
                    color: 'var(--color-blockWrite)',
                },
            ],
            formatValue: (value: ValueType) => {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                return formatBytes(numValue);
            },
        },
    ];

    const smallsStats = [
        {
            title: 'PIDs Count',
            description: 'Current number of processes',
            value: stats?.pidsCount || 0,
        },
        {
            title: 'Memory',
            description: 'Current memory usage percentage',
            value: `${stats?.memoryPercent?.toFixed(3) || 0}%`,
        },
    ];

    return (
        <>
            {children({ openStats: handleOpen })}
            <Dialog open={open} modal onOpenChange={handleClose}>
                <DialogContent
                    showCloseButton={false}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="gap-0 p-0 sm:max-w-5/6"
                >
                    <SSEProvider
                        connections={['stats']}
                        params={{ stats: { containerId: container!.id, refreshRate } }}
                    >
                        <DialogHeader className="flex flex-row items-center justify-between border-b p-2 pl-3">
                            <div className="flex flex-row items-center gap-2">
                                <DialogTitle className="flex items-center gap-2 text-sm">
                                    <div className="flex size-4 items-center">
                                        <Activity />
                                    </div>
                                    Stats — {container?.name}
                                    <Status
                                        className="rounded-none bg-transparent"
                                        status={currentStatus.status}
                                    >
                                        <StatusIndicator />
                                        <StatusLabel className={currentStatus.text}>
                                            {currentStatus.label}
                                        </StatusLabel>
                                    </Status>
                                </DialogTitle>
                            </div>
                            <div className="flex flex-row items-center gap-2">
                                <Select value={refreshRate} onValueChange={setRefreshRate}>
                                    <SelectTrigger className="!h-7">
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
                                    onClick={() => exportStats(container?.name)}
                                    disabled={chartData.length === 0}
                                    className="h-7 text-xs"
                                    variant="white"
                                    icon={Download}
                                    size="sm"
                                >
                                    Download
                                </Button>
                                <Separator orientation="vertical" className="!h-5" />
                                <Button onClick={handleClose} className="h-7 text-xs" size="sm">
                                    Close
                                </Button>
                            </div>
                        </DialogHeader>
                        <ScrollAreaWithShadow bottomShadow className="h-150 overflow-hidden">
                            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                                {smallsStats.map((stat, index) =>
                                    connectionState === 'connecting' ? (
                                        <Skeleton key={index} className="h-[150px] w-full" />
                                    ) : (
                                        <Card key={index} className={'bg-transparent'}>
                                            <CardHeader>
                                                <CardTitle>{stat.title}</CardTitle>
                                                <CardDescription>
                                                    {stat.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className={'text-2xl font-bold'}>
                                                {stat.value}
                                            </CardContent>
                                        </Card>
                                    ),
                                )}
                                {statsCard.map((stat, index) =>
                                    connectionState === 'connecting' ? (
                                        <Skeleton key={index} className="h-[250px] w-full" />
                                    ) : (
                                        <Card
                                            key={index}
                                            className={'rounded-md bg-transparent py-4'}
                                        >
                                            <CardHeader className={'border-b px-4 !pb-4'}>
                                                <CardTitle>{stat.title}</CardTitle>
                                                <CardDescription>
                                                    {stat.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className={'p-0'}>
                                                <ChartContainer
                                                    config={stat.config as unknown as ChartConfig}
                                                    className="h-[180px] w-full"
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
                                                                        stat.formatValue(value)
                                                                    }
                                                                />
                                                            }
                                                        />
                                                        <defs>
                                                            {stat.areas.map((area) => (
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

                                                        {stat.areas.map((area) => (
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
                        </ScrollAreaWithShadow>
                    </SSEProvider>
                </DialogContent>
            </Dialog>
        </>
    );
}
