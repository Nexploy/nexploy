'use client';

import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG } from '@/components/pipeline/pipelineTheme';
import { type NodeRunStatus } from '@/types/pipeline.type';
import { NodeWrapper } from '@/components/pipeline/nodes/NodeWrapper';
import { InputHandle } from '@/components/pipeline/nodes/handles/InputHandle';

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

export function AttachNode({ id, data, selected }: BaseNodeProps) {
    const { definition } = data;
    const handleColor = CATEGORY_BG[definition.category]!;

    return (
        <NodeWrapper id={id} data={data} selected={selected} className="flex flex-col items-center">
            {definition.handles.inputs.map((handle) => (
                <InputHandle
                    key={handle.id}
                    handle={handle}
                    nodeId={id}
                    handleColor={handleColor}
                />
            ))}
        </NodeWrapper>
    );
}
