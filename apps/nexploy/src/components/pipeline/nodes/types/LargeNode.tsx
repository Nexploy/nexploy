'use client';

import { memo } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { type NodeData } from '@nexploy/nodes/ui/nodeDefinition';
import { NodeWrapper } from '@/components/pipeline/nodes/NodeWrapper';
import { NodeAnimation } from '@/components/pipeline/nodes/NodeAnimation';
import { NodeRunBody } from '@/components/pipeline/nodes/NodeRunBody';
import { useNodeRunBody } from '@/components/pipeline/nodes/useNodeRunBody';
import { useTranslations } from 'next-intl';

interface LargeNodeProps {
    id: string;
    data: NodeData;
    selected?: boolean;
}

export const LargeNode = memo(({ id, data, selected }: LargeNodeProps) => {
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
                <span
                    className={cn(
                        'font-medium',
                        showBody ? 'min-w-0 truncate text-sm' : 'text-xs',
                        selected || showBody ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {t(`nodes.${data.nodeType}.name`)}
                </span>
            </NodeAnimation>
        </NodeWrapper>
    );
});
