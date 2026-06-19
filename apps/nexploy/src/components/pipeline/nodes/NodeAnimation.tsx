'use client';

import { cn } from '@workspace/ui/lib/utils';
import { CATEGORY_BORDER, CATEGORY_HEX } from '@/components/pipeline/pipelineTheme';
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
import { PropsWithChildren } from 'react';
import { AnimatedCircleX } from '@/components/pipeline/nodes/animations/AnimatedCircleX.tsx';
import { AnimatedBan } from '@/components/pipeline/nodes/animations/AnimatedBan.tsx';
import { AnimatedAlertCircle } from '@/components/pipeline/nodes/animations/AnimatedAlertCircle.tsx';
import { AnimatedCheckCircle } from '@/components/pipeline/nodes/animations/AnimatedCheckCircle.tsx';
import { AnimatedNodeSpinner } from '@/components/pipeline/nodes/animations/AnimatedNodeSpinner.tsx';

interface NodeAnimationProps {
    data: NodeData;
    selected?: boolean;
    square?: boolean;
}

export function NodeAnimation({
    data,
    selected,
    square = false,
    children,
}: PropsWithChildren<NodeAnimationProps>) {
    const Icon = data.definition.metadata.icon;
    const isStartNode = data.definition.isStartNode;
    const isEndNode = data.definition.isEndNode;
    const categoryHex = CATEGORY_HEX[data.definition.category];

    const rounded = square
        ? isStartNode
            ? 'rounded-l-4xl rounded-r-3xl'
            : isEndNode
              ? 'rounded-r-4xl rounded-l-3xl'
              : 'rounded-3xl'
        : isStartNode
          ? 'rounded-l-4xl rounded-r-3xl'
          : isEndNode
            ? 'rounded-r-4xl rounded-l-3xl'
            : 'rounded-full';

    const iconRounded = square ? 'rounded-xl' : 'rounded-full';

    const cornerClass = cn(
        'bg-card absolute size-4 rounded-full',
        square ? 'top-[9px] right-[9px]' : 'top-[13px] right-[13px]',
        isEndNode && 'top-[9px] left-[9px]',
    );

    const icon = (
        <div
            className={cn(
                'flex size-11 items-center justify-center',
                iconRounded,
                isStartNode && 'rounded-l-2xl',
                isEndNode && 'rounded-r-2xl',
                data.definition.metadata.color,
            )}
        >
            <Icon className="size-6" strokeWidth={1.5} />
        </div>
    );

    if (data.status === 'running') {
        return (
            <div
                className={cn('relative p-[2px]', rounded)}
                style={{ boxShadow: `0 0 20px 2px ${categoryHex}50` }}
            >
                <div className={cn('absolute inset-0 overflow-hidden', rounded)}>
                    <div
                        className="absolute top-1/2 left-1/2 aspect-square w-[300%] -translate-x-1/2 -translate-y-1/2 animate-spin"
                        style={{
                            animationDuration: '3s',
                            background: `conic-gradient(from 0deg, transparent 0deg, transparent 240deg, ${categoryHex}22 270deg, ${categoryHex}88 320deg, ${categoryHex} 355deg, ${categoryHex}88 360deg)`,
                        }}
                    />
                </div>
                <div
                    className={cn(
                        'bg-card relative flex items-center p-4',
                        children ? 'gap-3' : 'justify-center',
                        'overflow-hidden',
                        rounded,
                    )}
                >
                    {icon}
                    {children}
                    <AnimatedNodeSpinner
                        categoryHex={categoryHex!}
                        className={cn(
                            'absolute',
                            square ? 'top-1 right-1' : 'top-[11px] right-[11px]',
                            isEndNode && 'top-1 left-1',
                        )}
                    />
                </div>
            </div>
        );
    }

    return (
        <div
            style={
                data.status === 'completed'
                    ? { boxShadow: `0 0 20px 2px ${categoryHex}50` }
                    : undefined
            }
            className={cn(
                'bg-card relative flex items-center overflow-hidden border-2 p-4 shadow-lg transition-[border-color,box-shadow] duration-300',
                children ? 'gap-3' : 'justify-center',
                rounded,
                data.status === 'completed'
                    ? CATEGORY_BORDER[data.definition.category]
                    : data.status === 'not-configured'
                      ? 'border-yellow-500/50'
                      : selected
                        ? CATEGORY_BORDER[data.definition.category]
                        : 'border-border hover:border-accent',
                (data.status === 'failed' ||
                    data.status === 'skipped' ||
                    data.status === 'cancelled') &&
                    'border-border',
            )}
        >
            {data.status === 'completed' && <AnimatedCheckCircle className={cornerClass} />}
            {data.status === 'failed' && <AnimatedCircleX className={cornerClass} />}
            {data.status === 'cancelled' && <AnimatedBan className={cornerClass} />}
            {data.status === 'not-configured' && <AnimatedAlertCircle className={cornerClass} />}
            {icon}
            {children}
        </div>
    );
}
