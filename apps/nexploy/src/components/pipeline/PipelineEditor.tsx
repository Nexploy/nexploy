'use client';

import '@xyflow/react/dist/style.css';
import { useRef } from 'react';

import { usePipelineContext } from '@/contexts/PipelineContext';
import { NodeAddPanel } from '@/components/pipeline/nodes/add/NodeAddPanel';
import { NodeTemplatePanel } from '@/components/pipeline/nodes/template/NodeTemplatePanel';
import { PipelineCanvas } from '@/components/pipeline/PipelineCanvas';
import { usePipelineLiveBuild } from '@/hooks/usePipelineLiveBuild';
import { PipelineToolbar } from '@/components/pipeline/PipelineToolbar';
import { NodeConfigPanel } from '@/components/pipeline/nodes/nodeConfigPanel/NodeConfigPanel';

export function PipelineEditor() {
    const { nodes, panelNodeId, activeBuildId } = usePipelineContext();
    const panelNode = nodes.find((n) => n.id === panelNodeId);
    const lastPanelNodeRef = useRef(panelNode);
    if (panelNode) lastPanelNodeRef.current = panelNode;

    usePipelineLiveBuild({ buildId: activeBuildId });

    return (
        <div className="flex h-full flex-col">
            <PipelineToolbar />
            <div className="mx-5 mb-5 flex flex-1 overflow-hidden rounded-md rounded-t-none border">
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
