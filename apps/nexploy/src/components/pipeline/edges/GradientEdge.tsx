'use client';

import {
    BaseEdge,
    type EdgeProps,
    EdgeToolbar,
    getBezierPath,
    useNodes,
    useReactFlow,
    useViewport,
} from '@xyflow/react';
import { type NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_HEX } from '@/components/pipeline/pipelineTheme';
import { Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';

export function GradientEdge(props: EdgeProps) {
    const {
        id,
        source,
        target,
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        style,
    } = props;

    const nodes = useNodes();
    const { deleteElements, getEdges } = useReactFlow();
    const { zoom } = useViewport();
    const hoveredEdgeId = usePipelineEditorStore((s) => s.hoveredEdgeId);

    const sourceNode = nodes.find((n) => n.id === source);
    const targetNode = nodes.find((n) => n.id === target);

    const sourceCategory = (sourceNode?.data?.definition as NodeDefinition)?.category;
    const targetCategory = (targetNode?.data?.definition as NodeDefinition)?.category;

    const sourceColor = (sourceCategory && CATEGORY_HEX[sourceCategory]) || '#888';
    const targetColor = (targetCategory && CATEGORY_HEX[targetCategory]) || '#888';

    const gradientId = `edge-gradient-${id}`;

    const [edgePath, centerX, centerY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const deleteEdge = () => {
        const edge = getEdges().find((e) => e.id === id);
        if (edge) deleteElements({ edges: [edge] });
    };

    return (
        <>
            <defs>
                <linearGradient
                    id={gradientId}
                    gradientUnits="userSpaceOnUse"
                    x1={sourceX}
                    y1={sourceY}
                    x2={targetX}
                    y2={targetY}
                >
                    <stop offset="0%" stopColor={sourceColor} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={targetColor} stopOpacity={0.9} />
                </linearGradient>
            </defs>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    ...style,
                    stroke: `url(#${gradientId})`,
                    strokeWidth: 2,
                }}
            />
            <EdgeToolbar edgeId={id} x={centerX} y={centerY} isVisible={hoveredEdgeId === id}>
                <Button
                    className="nodrag nopan size-8 duration-0"
                    size={'icon'}
                    variant={'destructiveOutline'}
                    style={{ transform: `scale(${zoom})` }}
                    onClick={deleteEdge}
                >
                    <Trash2 className={'size-4'} />
                </Button>
            </EdgeToolbar>
        </>
    );
}
