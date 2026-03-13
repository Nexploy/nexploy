'use client';

import React from 'react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BG } from '@/components/pipeline/pipelineTheme';
import { type NodeRunStatus } from '@/types/pipeline.type';
import { NodeWrapper } from '@/components/pipeline/nodes/NodeWrapper';
import { InputHandle } from '@/components/pipeline/nodes/handles/InputHandle';
import { OutputHandle } from '@/components/pipeline/nodes/handles/OutputHandle';
import { AttachmentHandle } from '@/components/pipeline/nodes/handles/AttachmentHandle';

interface LargeNodeProps {
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

export function LargeNode({ id, data, selected }: LargeNodeProps) {
    const { definition } = data;
    const attachments = definition.handles.attachments ?? [];
    const handleColor = CATEGORY_BG[definition.category]!;

    return (
        <NodeWrapper id={id} data={data} selected={selected}>
            {definition.handles.inputs.map((handle) => (
                <InputHandle
                    key={handle.id}
                    handle={handle}
                    nodeId={id}
                    handleColor={handleColor}
                />
            ))}

            {definition.handles.outputs.map((handle) => (
                <OutputHandle
                    key={handle.id}
                    handle={handle}
                    nodeId={id}
                    handleColor={handleColor}
                />
            ))}

            {attachments.map((attach) => (
                <AttachmentHandle key={attach.id} attach={attach} handleColor={handleColor} />
            ))}
        </NodeWrapper>
    );
}
