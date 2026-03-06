'use client';

import '@xyflow/react/dist/style.css';
import { useEffect } from 'react';
import { useAction } from 'next-safe-action/hooks';

import { NodeType } from '@workspace/typescript-interface/pipeline/node';
import { savePipelineAction } from '@/actions/repository/pipeline/savePipeline.action';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { flowToGraph } from '@/components/pipeline/utils/graphConvert';
import { NodePalette } from '@/components/pipeline/nodes/NodePalette';
import { NodeConfigPanel } from '@/components/pipeline/nodes/NodeConfigPanel';
import { PipelineCanvas } from '@/components/pipeline/PipelineCanvas';

export function PipelineEditor({ repositoryId }: { repositoryId: string }) {
    const { nodes, edges, panelNodeId, selectedNodeIds, saveVersion } = usePipelineContext();
    const panelNode = nodes.find((n) => n.id === panelNodeId);

    const { execute: savePipeline } = useAction(savePipelineAction);

    useEffect(() => {
        savePipeline({ repositoryId, graph: flowToGraph(nodes, edges) });
    }, [saveVersion]);

    return (
        <div className="flex h-full flex-col">
            <div className="mx-5 mb-5 flex flex-1 overflow-hidden rounded-md border">
                <PipelineCanvas />
                <NodePalette />
                {panelNode && selectedNodeIds.length <= 1 && (
                    <NodeConfigPanel
                        node={{
                            id: panelNode.id,
                            type: panelNode.data.pipelineNodeType as NodeType,
                            position: panelNode.position,
                            data: {
                                type: panelNode.data.pipelineNodeType as NodeType,
                                config: (panelNode.data.config as Record<string, unknown>) ?? {},
                                label: panelNode.data.label as string,
                            },
                        }}
                    />
                )}
            </div>
        </div>
    );
}
