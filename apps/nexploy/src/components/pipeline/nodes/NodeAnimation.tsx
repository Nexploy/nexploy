'use client';

import { cn } from '@workspace/ui/lib/utils';
import { CATEGORY_BORDER, CATEGORY_HEX } from '@/components/pipeline/pipelineTheme';
import { type NodeData } from '@nexploy/nodes/ui/nodeDefinition';
import { PropsWithChildren, ReactNode } from 'react';
import { AnimatedCircleX } from '@/components/pipeline/nodes/animations/AnimatedCircleX.tsx';
import { AnimatedBan } from '@/components/pipeline/nodes/animations/AnimatedBan.tsx';
import { AnimatedAlertCircle } from '@/components/pipeline/nodes/animations/AnimatedAlertCircle.tsx';
import { AnimatedCheckCircle } from '@/components/pipeline/nodes/animations/AnimatedCheckCircle.tsx';
import { AnimatedNodeSpinner } from '@/components/pipeline/nodes/animations/AnimatedNodeSpinner.tsx';

interface NodeAnimationProps {
    data: NodeData;
    selected?: boolean;
    square?: boolean;
    body?: ReactNode;
    bodyAlwaysOpen?: boolean;
}

export function NodeAnimation({
    data,
    selected,
    square = false,
    body,
    bodyAlwaysOpen = false,
    children,
}: PropsWithChildren<NodeAnimationProps>) {
    const Icon = data.definition.metadata.icon;
    const isStartNode = data.definition.isStartNode;
    const isEndNode = data.definition.isEndNode;
    const categoryHex = CATEGORY_HEX[data.definition.category];
    const isFailed = data.status === 'failed';

    const hasBody = !!body;

    const rounded = hasBody
        ? 'rounded-3xl'
        : square
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

    const iconRounded = square || hasBody ? 'rounded-xl' : 'rounded-full';

    const cornerClass = cn(
        'absolute size-4 rounded-full bg-card',
        square || hasBody ? 'top-2 right-2' : 'top-[11px] right-[11px]',
        isEndNode && !hasBody && 'top-2 left-2',
    );

    const icon = (
        <div
            className={cn(
                'flex size-11 shrink-0 items-center justify-center',
                iconRounded,
                !hasBody && isStartNode && 'rounded-l-2xl',
                !hasBody && isEndNode && 'rounded-r-2xl',
                data.definition.metadata.color,
            )}
        >
            <Icon className="size-6" strokeWidth={1.5} />
        </div>
    );

    const header = (
        <div
            className={cn('flex items-center', children ? 'gap-3' : 'justify-center', hasBody && 'w-full min-w-0 pr-6')}
        >
            {icon}
            {children}
        </div>
    );

    const content = hasBody ? (
        <div className={cn('flex w-full min-w-0 max-w-xs flex-col', bodyAlwaysOpen ? 'w-[280px]' : 'w-[220px]')}>
            {header}
            <div
                className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-out',
                    bodyAlwaysOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] group-hover:grid-rows-[1fr]',
                )}
            >
                <div className="overflow-hidden">{body}</div>
            </div>
        </div>
    ) : (
        header
    );

    if (data.status === 'running') {
        return (
            <div className={cn('relative p-[2px]', rounded)} style={{ boxShadow: `0 0 20px 2px ${categoryHex}50` }}>
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
                        'relative flex items-center bg-card p-4',
                        children || hasBody ? 'gap-3' : 'justify-center',
                        'overflow-hidden',
                        rounded,
                    )}
                >
                    {content}
                    <AnimatedNodeSpinner
                        categoryHex={categoryHex!}
                        className={cn(
                            'absolute',
                            square || hasBody ? 'top-1.5 right-1.5' : 'top-[11px] right-[11px]',
                            isEndNode && !hasBody && 'top-1 left-1',
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
                    : isFailed
                      ? { boxShadow: '0 0 20px 2px var(--destructive)' }
                      : undefined
            }
            className={cn(
                'relative flex items-center overflow-hidden border-2 bg-card p-4 shadow-lg transition-[border-color,box-shadow] duration-300',
                children || hasBody ? 'gap-3' : 'justify-center',
                rounded,
                data.status === 'completed'
                    ? CATEGORY_BORDER[data.definition.category]
                    : data.status === 'not-configured'
                      ? 'border-yellow-500/50'
                      : selected
                        ? CATEGORY_BORDER[data.definition.category]
                        : 'border-border hover:border-accent',
                (data.status === 'skipped' || data.status === 'cancelled') && 'border-border',
                isFailed && 'border-destructive',
            )}
        >
            {data.status === 'completed' && <AnimatedCheckCircle className={cornerClass} />}
            {isFailed && <AnimatedCircleX className={cornerClass} />}
            {data.status === 'cancelled' && <AnimatedBan className={cornerClass} />}
            {data.status === 'not-configured' && <AnimatedAlertCircle className={cornerClass} />}
            {content}
        </div>
    );
}
