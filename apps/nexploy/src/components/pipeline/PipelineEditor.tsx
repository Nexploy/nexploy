'use client';

import '@xyflow/react/dist/style.css';
import { useEffect, useRef } from 'react';
import { useAction } from 'next-safe-action/hooks';

import { savePipelineAction } from '@/actions/repository/pipeline/savePipeline.action';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { flowToGraph } from '@/components/pipeline/utils/graphConvert';
import { NodeAddPanel } from '@/components/pipeline/nodes/add/NodeAddPanel';
import { NodeTemplatePanel } from '@/components/pipeline/nodes/template/NodeTemplatePanel';
import { NodeConfigPanel } from '@/components/pipeline/nodes/NodeConfigPanel';
import { PipelineCanvas } from '@/components/pipeline/PipelineCanvas';
import { useParams } from 'next/navigation';

export function PipelineEditor() {
    const params = useParams<{ repositoryId: string }>();

    const { nodes, edges, panelNodeId, saveVersion } = usePipelineContext();
    const panelNode = nodes.find((n) => n.id === panelNodeId);
    const lastPanelNodeRef = useRef(panelNode);
    if (panelNode) lastPanelNodeRef.current = panelNode;

    const { execute: savePipeline } = useAction(savePipelineAction);

    useEffect(() => {
        if (saveVersion !== 0)
            savePipeline({ repositoryId: params.repositoryId, graph: flowToGraph(nodes, edges) });
    }, [saveVersion]);

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
