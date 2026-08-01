import { ContainerStatsSample } from '@workspace/typescript-interface/docker/docker.containers.stats';
import { ContainersStatsHistoryPoint } from '@workspace/typescript-interface/stores/docker/containersStatsStore';
import { formatBytes } from '@/utils/formatBytes';

export const MONITORING_CHART_COLORS = [
    'var(--chart-2)',
    'var(--chart-1)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

export const TOP_CONTAINERS_COUNT = 5;

export type ContainerMetricKey = keyof Omit<ContainersStatsHistoryPoint, 'timestamp'>;

export interface MultiSeriesPoint {
    timestamp: number;
    [seriesKey: string]: number;
}

export interface ContainerSeries {
    key: string;
    label: string;
    color: string;
    points: ContainersStatsHistoryPoint[];
}

export function splitDuration(totalSeconds: number) {
    const seconds = Math.max(0, Math.floor(totalSeconds));

    return {
        days: Math.floor(seconds / 86400),
        hours: Math.floor((seconds % 86400) / 3600),
        minutes: Math.floor((seconds % 3600) / 60),
    };
}

export function formatRate(bytesPerSecond: number): string {
    return `${formatBytes(Math.max(0, bytesPerSecond))}/s`;
}

export function formatPercent(value: number, digits = 1): string {
    return `${(Number.isFinite(value) ? value : 0).toFixed(digits)}%`;
}

export function usageToneClass(percent: number): string {
    if (percent >= 90) return 'text-degraded';
    if (percent >= 70) return 'text-maintenance';
    return 'text-foreground';
}

export function sortContainersBy(stats: ContainerStatsSample[], metric: ContainerMetricKey): ContainerStatsSample[] {
    return [...stats].sort((a, b) => (b[metric] as number) - (a[metric] as number));
}

export function topContainersBy(
    stats: ContainerStatsSample[],
    metric: ContainerMetricKey,
    count = TOP_CONTAINERS_COUNT,
): ContainerStatsSample[] {
    return sortContainersBy(
        stats.filter((stat) => stat.state === 'running'),
        metric,
    )
        .filter((stat) => (stat[metric] as number) > 0)
        .slice(0, count);
}

export function buildContainerSeries(
    stats: ContainerStatsSample[],
    history: Record<string, ContainersStatsHistoryPoint[]>,
): ContainerSeries[] {
    return stats.map((stat, index) => ({
        key: stat.containerId,
        label: stat.name,
        color: MONITORING_CHART_COLORS[index % MONITORING_CHART_COLORS.length]!,
        points: history[stat.containerId] ?? [],
    }));
}

export function buildMultiSeriesData(series: ContainerSeries[], metric: ContainerMetricKey): MultiSeriesPoint[] {
    const length = series.reduce((max, entry) => Math.max(max, entry.points.length), 0);
    if (length === 0) return [];

    const reference = series.find((entry) => entry.points.length === length);

    return Array.from({ length }, (_, index) => {
        const point: MultiSeriesPoint = {
            timestamp: reference?.points[index]?.timestamp ?? Date.now(),
        };

        series.forEach((entry) => {
            const offset = length - entry.points.length;
            point[entry.key] = entry.points[index - offset]?.[metric] ?? 0;
        });

        return point;
    });
}
