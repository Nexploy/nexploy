'use client';

import '@xyflow/react/dist/style.css';
import { useRef } from 'react';

import { usePipelineContext } from '@/contexts/PipelineContext';
import { NodeAddPanel } from '@/components/pipeline/nodes/add/NodeAddPanel';
import { NodeTemplatePanel } from '@/components/pipeline/nodes/template/NodeTemplatePanel';
import { NodeConfigPanel } from '@/components/pipeline/nodes/NodeConfigPanel';
import { PipelineCanvas } from '@/components/pipeline/PipelineCanvas';

export function PipelineEditor() {
    const { nodes, panelNodeId } = usePipelineContext();
    const panelNode = nodes.find((n) => n.id === panelNodeId);
    const lastPanelNodeRef = useRef(panelNode);
    if (panelNode) lastPanelNodeRef.current = panelNode;

    return (
        <div className="flex h-full flex-col">
            <div className="mx-5 mb-5 flex flex-1 overflow-hidden rounded-md border">
                <PipelineCanvas />
                <NodeTemplatePanel />
                <NodeAddPanel />
            </div>
            {lastPanelNodeRef.current && (
                <NodeConfigPanel isOpen={!!panelNode} node={lastPanelNodeRef.current} />
            )}
        </div>
    );
}
