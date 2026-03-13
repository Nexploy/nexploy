'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { type NodeRunStatus } from '@/types/pipeline.type';
import { NodeWrapper } from '@/components/pipeline/nodes/NodeWrapper';
import { CATEGORY_BORDER, CATEGORY_GLOW, ICON_NAME_MAP } from '@/components/pipeline/pipelineTheme';
import { useTranslations } from 'next-intl';

interface AttachNodeProps {
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

export function AttachNode({ id, data, selected }: AttachNodeProps) {
    const t = useTranslations('repository.pipeline');
    const Icon = ICON_NAME_MAP[data.definition.metadata.icon] as LucideIcon;

    return (
        <NodeWrapper id={id} data={data}>
            <div
                className={cn(
                    'bg-card relative flex items-center justify-center rounded-2xl border-2 p-4 shadow-lg transition-all duration-300',
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
                <div
                    className={cn(
                        'flex size-8 items-center justify-center rounded-lg',
                        data.definition.metadata.color,
                    )}
                >
                    <Icon className="size-4" strokeWidth={1.5} />
                </div>
            </div>
            <span
                className={cn(
                    'absolute top-full left-1/2 mt-2 w-[80px] -translate-x-1/2 text-center text-[10px] font-medium transition-colors',
                    selected ? 'text-foreground' : 'text-muted-foreground',
                )}
            >
                {t(`nodes.${data.nodeType}.name`)}
            </span>
        </NodeWrapper>
    );
}
