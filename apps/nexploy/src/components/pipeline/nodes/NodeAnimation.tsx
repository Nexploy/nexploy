'use client';

import { cn } from '@workspace/ui/lib/utils';
import { CATEGORY_BORDER, CATEGORY_HEX, ICON_NAME_MAP } from '@/components/pipeline/pipelineTheme';
import { CheckCircle2, CircleX, LucideIcon } from 'lucide-react';
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
import { PropsWithChildren } from 'react';

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
    const Icon = ICON_NAME_MAP[data.definition.metadata.icon] as LucideIcon;
    const isStartNode = data.definition.isStartNode;
    const categoryHex = CATEGORY_HEX[data.definition.category];

    const rounded = square
        ? isStartNode
            ? 'rounded-l-4xl rounded-r-2xl'
            : 'rounded-2xl'
        : isStartNode
          ? 'rounded-l-4xl rounded-r-2xl'
          : 'rounded-full';

    const iconRounded = square ? 'rounded-xl' : 'rounded-full';

    const icon = (
        <div
            className={cn(
                'flex size-11 items-center justify-center',
                iconRounded,
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
                        rounded,
                    )}
                >
                    {icon}
                    {children}
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
                'bg-card relative flex items-center border-2 p-4 shadow-lg transition-[border-color,box-shadow] duration-300',
                children ? 'gap-3' : 'justify-center',
                rounded,
                data.status === 'completed'
                    ? CATEGORY_BORDER[data.definition.category]
                    : selected
                      ? CATEGORY_BORDER[data.definition.category]
                      : 'border-border hover:border-accent',
                (data.status === 'failed' || data.status === 'skipped') && 'border-border',
            )}
        >
            {data.status === 'completed' && (
                <CheckCircle2 className={cn('bg-card absolute size-4 rounded-full text-green-500', square ? 'top-1 right-1' : 'top-[11px] right-[11px]')} />
            )}
            {data.status === 'failed' && (
                <CircleX className={cn('bg-card absolute size-4 rounded-full text-red-500', square ? 'top-1 right-1' : 'top-[11px] right-[11px]')} />
            )}
            {icon}
            {children}
        </div>
    );
}
