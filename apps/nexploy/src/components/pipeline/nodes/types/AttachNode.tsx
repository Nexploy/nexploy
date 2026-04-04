'use client';

import { memo } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
import { NodeWrapper } from '@/components/pipeline/nodes/NodeWrapper';
import { useTranslations } from 'next-intl';
import { NodeAnimation } from '@/components/pipeline/nodes/NodeAnimation';

interface AttachNodeProps {
    id: string;
    data: NodeData;
    selected?: boolean;
}

export const AttachNode = memo(({ id, data, selected }: AttachNodeProps) => {
    const t = useTranslations('repository.pipeline');

    return (
        <NodeWrapper id={id} data={data}>
            <NodeAnimation selected={selected} data={data} />
            <span
                className={cn(
                    'absolute top-full left-1/2 mt-2 -translate-x-1/2 text-center text-xs font-medium transition-colors',
                    selected ? 'text-foreground' : 'text-muted-foreground',
                )}
            >
                {t(`nodes.${data.nodeType}.name`)}
            </span>
        </NodeWrapper>
    );
});
