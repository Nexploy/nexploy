'use client';

import { useId, useMemo } from 'react';
import { cn } from '@workspace/ui/lib/utils';

interface SparklineProps {
    values: number[];
    color?: string;
    className?: string;
    max?: number;
}

const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 32;

export function Sparkline({ values, color = 'var(--chart-2)', className, max }: SparklineProps) {
    const gradientId = useId();

    const { line, area, isEmpty } = useMemo(() => {
        const points = values.filter((value) => Number.isFinite(value));

        if (points.length === 0) {
            return { line: '', area: '', isEmpty: true };
        }

        const upperBound = Math.max(max ?? 0, ...points, 0.0001);
        const step = points.length > 1 ? VIEWBOX_WIDTH / (points.length - 1) : 0;

        const coordinates = points.map((value, index) => {
            const x = points.length > 1 ? index * step : VIEWBOX_WIDTH / 2;
            const y = VIEWBOX_HEIGHT - (Math.max(0, value) / upperBound) * (VIEWBOX_HEIGHT - 2) - 1;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        });

        const linePath =
            points.length > 1
                ? coordinates.join(' ')
                : `0,${coordinates[0]!.split(',')[1]} ${VIEWBOX_WIDTH},${coordinates[0]!.split(',')[1]}`;

        return {
            line: linePath,
            area: `0,${VIEWBOX_HEIGHT} ${linePath} ${VIEWBOX_WIDTH},${VIEWBOX_HEIGHT}`,
            isEmpty: false,
        };
    }, [values, max]);

    if (isEmpty) {
        return <div className={cn('h-8 w-full rounded-sm bg-muted/40', className)} />;
    }

    return (
        <svg
            className={cn('h-8 w-full', className)}
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            preserveAspectRatio="none"
            role="img"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
            </defs>
            <polygon points={area} fill={`url(#${gradientId})`} />
            <polyline
                points={line}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}
