'use client';

import { useEffect, useMemo } from 'react';
import {
    Background,
    BackgroundVariant,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react';
import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { NodeRunStatus } from '@/types/pipeline.type';
import { graphToFlow } from '@/components/pipeline/utils/graphConvert';
import { BaseNode } from '@/components/pipeline/nodes/BaseNode';
import { GradientEdge } from '@/components/pipeline/edges/GradientEdge';
import { useInngestSubscription } from '@inngest/realtime/hooks';
import { onGetTokenBuildIdAction } from '@/actions/inngest/tokenBuildId.action';
import { BuildStatus } from '@workspace/typescript-interface/inngest/build';

const nodeTypes = { 'pipeline-node': BaseNode };
const edgeTypes = { 'gradient-edge': GradientEdge };

interface BuildPipelineViewProps {
    graph: PipelineGraph;
    initialNodeStatuses: Record<string, NodeRunStatus>;
    buildId: string;
    buildStatus: BuildStatus;
}

const TERMINAL_STATUSES: BuildStatus[] = ['COMPLETED', 'FAILED', 'CANCELLED'];

function BuildPipelineViewInner({
    graph,
    initialNodeStatuses,
    buildId,
    buildStatus,
}: BuildPipelineViewProps) {
    const { updateNodeData } = useReactFlow();

    const isLive = !TERMINAL_STATUSES.includes(buildStatus);

    useEffect(() => {
        for (const [nodeId, status] of Object.entries(initialNodeStatuses)) {
            updateNodeData(nodeId, { runStatus: status, viewOnly: true });
        }
    }, [initialNodeStatuses, updateNodeData]);

    const { data } = useInngestSubscription({
        enabled: isLive,
        refreshToken: async () => {
            const result = await onGetTokenBuildIdAction({
                buildId,
                topics: ['node-status', 'status'],
            });
            return result?.data ?? null;
        },
    });

    useEffect(() => {
        for (const evt of data) {
            if (evt.topic === 'node-status' && evt.data?.nodeId) {
                updateNodeData(evt.data.nodeId, {
                    runStatus: evt.data.status as NodeRunStatus,
                    viewOnly: true,
                });
            }
        }
    }, [data, updateNodeData]);

    const { nodes, edges } = useMemo(() => graphToFlow(graph), [graph]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            fitView
            fitViewOptions={{ padding: 0.4 }}
            style={{ background: 'var(--background)' }}
            proOptions={{ hideAttribution: true }}
        >
            <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1.5}
                color="var(--base-6)"
            />
        </ReactFlow>
    );
}

export function BuildPipelineView(props: BuildPipelineViewProps) {
    if (props.graph.nodes.length === 0) return null;
    return (
        <ReactFlowProvider>
            <BuildPipelineViewInner {...props} />
        </ReactFlowProvider>
    );
}
