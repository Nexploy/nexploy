'use client';

import { CheckCircle2, CircleX, Loader2, LucideIcon } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { type NodeRunStatus } from '@/types/pipeline.type';
import { NodeWrapper } from '@/components/pipeline/nodes/NodeWrapper';
import { CATEGORY_BORDER, CATEGORY_GLOW, ICON_NAME_MAP } from '@/components/pipeline/pipelineTheme';
import { useTranslations } from 'next-intl';

interface BaseNodeProps {
    id: string;
    data: {
        nodeType: string;
        definition: NodeDefinition;
        config: Record<string, unknown>;
        disabled?: boolean;
        viewOnly?: boolean;
        runStatus?: NodeRunStatus;
    };
    selected?: boolean;
}

export function BaseNode({ id, data, selected }: BaseNodeProps) {
    const t = useTranslations('repository.pipeline');
    const Icon = ICON_NAME_MAP[data.definition.metadata.icon] as LucideIcon;
    const isStartNode = data.definition.isStartNode;

    return (
        <NodeWrapper id={id} data={data}>
            <div
                className={cn(
                    'bg-card relative flex items-center justify-center border-2 p-4 shadow-lg transition-all duration-300',
                    isStartNode ? 'rounded-l-4xl rounded-r-2xl' : 'rounded-2xl',
                    data.runStatus === 'running' &&
                        'animate-pulse border-amber-500 shadow-xl shadow-amber-500/40',
                    data.runStatus === 'completed' &&
                        'border-green-500 shadow-xl shadow-green-500/30',
                    data.runStatus === 'failed' && 'border-red-500 shadow-xl shadow-red-500/30',
                    data.runStatus === 'skipped' && 'border-muted',
                    !data.runStatus &&
                        (selected
                            ? cn(
                                  'shadow-xl',
                                  CATEGORY_BORDER[data.definition.category],
                                  CATEGORY_GLOW[data.definition.category],
                              )
                            : 'border-border hover:border-accent'),
                )}
            >
                {data.runStatus === 'running' && (
                    <Loader2 className="absolute top-1 right-1 size-4 animate-spin text-amber-500" />
                )}
                {data.runStatus === 'completed' && (
                    <CheckCircle2 className="absolute top-1 right-1 size-4 text-green-500" />
                )}
                {data.runStatus === 'failed' && (
                    <CircleX className="absolute top-1 right-1 size-4 text-red-500" />
                )}
                <div
                    className={cn(
                        'flex size-11 items-center justify-center rounded-xl',
                        data.definition.metadata.color,
                    )}
                >
                    <Icon className="size-6" strokeWidth={1.5} />
                </div>
            </div>
            <span
                className={cn(
                    'absolute top-full left-1/2 mt-2 w-[120px] -translate-x-1/2 text-center text-xs font-medium transition-colors',
                    selected ? 'text-foreground' : 'text-muted-foreground',
                )}
            >
                {t(`nodes.${data.nodeType}.name`)}
            </span>
        </NodeWrapper>
    );
}
