'use client';

import { memo } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
import { useTranslations } from 'next-intl';
import { NodeWrapper } from '@/components/pipeline/nodes/NodeWrapper';
import { CATEGORY_BORDER, CATEGORY_HEX } from '@/components/pipeline/pipelineTheme';
import { AnimatedCircleX } from '@/components/pipeline/nodes/animations/AnimatedCircleX.tsx';
import { AnimatedBan } from '@/components/pipeline/nodes/animations/AnimatedBan.tsx';
import { AnimatedAlertCircle } from '@/components/pipeline/nodes/animations/AnimatedAlertCircle.tsx';
import { AnimatedCheckCircle } from '@/components/pipeline/nodes/animations/AnimatedCheckCircle.tsx';
import { AnimatedNodeSpinner } from '@/components/pipeline/nodes/animations/AnimatedNodeSpinner.tsx';

interface StageNodeProps {
    id: string;
    data: NodeData;
    selected?: boolean;
}

export const StageNode = memo(({ id, data, selected }: StageNodeProps) => {
    const t = useTranslations('repository.pipeline');
    const Icon = data.definition.metadata.icon;
    const category = data.definition.category;
    const categoryHex = CATEGORY_HEX[category];

    const stageName = (data.config?.stageName as string) || '';
    const triggerOnFailure = Boolean(data.config?.triggerOnFailure);
    const isRunning = data.status === 'running';

    const cornerClass = 'absolute top-1.5 right-1.5 size-4';

    return (
        <NodeWrapper id={id} data={data}>
            <div
                style={
                    data.status === 'completed' || isRunning
                        ? { boxShadow: `0 0 22px 2px ${categoryHex}45` }
                        : undefined
                }
                className={cn(
                    'bg-card relative flex min-w-[230px] items-center gap-3 overflow-hidden rounded-2xl border-2 p-3 pr-5 shadow-lg transition-[border-color,box-shadow] duration-300',
                    data.status === 'completed'
                        ? CATEGORY_BORDER[category]
                        : data.status === 'not-configured'
                          ? 'border-yellow-500/50'
                          : selected
                            ? CATEGORY_BORDER[category]
                            : 'border-border hover:border-accent',
                    (data.status === 'failed' ||
                        data.status === 'skipped' ||
                        data.status === 'cancelled') &&
                        'border-border',
                )}
            >
                {/* Accent rail on the left edge */}
                <span
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ backgroundColor: categoryHex }}
                />

                <div
                    className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-xl',
                        data.definition.metadata.color,
                    )}
                >
                    <Icon className="size-6" strokeWidth={1.5} />
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                    <span
                        className={cn(
                            'truncate text-sm font-semibold',
                            selected ? 'text-foreground' : 'text-foreground/90',
                        )}
                    >
                        {t(`nodes.${data.nodeType}.name`)}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                        <ArrowRight className="size-3 shrink-0" style={{ color: categoryHex }} />
                        <span className="truncate">
                            {stageName || t('config.selectTargetStage')}
                        </span>
                    </span>
                    {triggerOnFailure && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500">
                            <AlertTriangle className="size-2.5 shrink-0" />
                            {t('stageNode.alsoOnFailure')}
                        </span>
                    )}
                </div>

                {isRunning && <AnimatedNodeSpinner categoryHex={categoryHex!} className={cornerClass} />}
                {data.status === 'completed' && <AnimatedCheckCircle className={cornerClass} />}
                {data.status === 'failed' && <AnimatedCircleX className={cornerClass} />}
                {data.status === 'cancelled' && <AnimatedBan className={cornerClass} />}
                {data.status === 'not-configured' && <AnimatedAlertCircle className={cornerClass} />}
            </div>
        </NodeWrapper>
    );
});

StageNode.displayName = 'StageNode';
