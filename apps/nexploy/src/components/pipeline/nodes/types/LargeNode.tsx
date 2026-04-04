'use client';

import { memo } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
import { NodeWrapper } from '@/components/pipeline/nodes/NodeWrapper';
import { NodeAnimation } from '@/components/pipeline/nodes/NodeAnimation';
import { useTranslations } from 'next-intl';

interface LargeNodeProps {
    id: string;
    data: NodeData;
    selected?: boolean;
}

export const LargeNode = memo(({ id, data, selected }: LargeNodeProps) => {
    const t = useTranslations('repository.pipeline');

    return (
        <NodeWrapper id={id} data={data}>
            <NodeAnimation data={data} selected={selected} square>
                <span
                    className={cn(
                        'text-xs font-medium',
                        selected ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {t(`nodes.${data.nodeType}.name`)}
                </span>
            </NodeAnimation>
        </NodeWrapper>
    );
});
