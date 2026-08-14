'use client';

import { memo } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { type NodeData } from '@nexploy/nodes/ui/nodeDefinition';
import { NodeWrapper } from '@/components/pipeline/nodes/NodeWrapper';
import { NodeAnimation } from '@/components/pipeline/nodes/NodeAnimation';
import { NodeRunBody } from '@/components/pipeline/nodes/NodeRunBody';
import { useNodeRunBody } from '@/components/pipeline/nodes/useNodeRunBody';
import { useTranslations } from 'next-intl';

interface BaseNodeProps {
    id: string;
    data: NodeData;
    selected?: boolean;
}

export const BaseNode = memo(({ id, data, selected }: BaseNodeProps) => {
    const t = useTranslations('repository.pipeline');
    const { showBody, alwaysOpen } = useNodeRunBody(data);

    return (
        <NodeWrapper id={id} data={data}>
            <NodeAnimation
                data={data}
                selected={selected}
                square
                bodyAlwaysOpen={alwaysOpen}
                body={showBody ? <NodeRunBody data={data} /> : undefined}
            >
                {showBody && (
                    <span
                        className={cn(
                            'min-w-0 truncate text-sm font-medium',
                            selected ? 'text-foreground' : 'text-foreground/90',
                        )}
                    >
                        {t(`nodes.${data.nodeType}.name`)}
                    </span>
                )}
            </NodeAnimation>
            {!showBody && (
                <span
                    className={cn(
                        'absolute top-full left-1/2 mt-2 w-[120px] -translate-x-1/2 text-center text-xs font-medium transition-colors',
                        selected ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {t(`nodes.${data.nodeType}.name`)}
                </span>
            )}
        </NodeWrapper>
    );
});
