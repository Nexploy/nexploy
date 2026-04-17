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
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
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
    const dragOverEdgeId = usePipelineEditorStore((s) => s.dragOverEdgeId);
    const isDropTarget = dragOverEdgeId === id;

    const sourceNode = nodes.find((n) => n.id === source);
    const targetNode = nodes.find((n) => n.id === target);

    const sourceData = sourceNode?.data as NodeData | undefined;
    const targetData = targetNode?.data as NodeData | undefined;

    const isSourceDimmed = sourceData?.disabled || sourceData?.status === 'skipped';
    const isTargetDimmed = targetData?.disabled || targetData?.status === 'skipped';
    const isDimmed = isSourceDimmed || isTargetDimmed;

    const sourceCategory = (sourceNode?.data?.definition as NodeDefinition)?.category;
    const targetCategory = (targetNode?.data?.definition as NodeDefinition)?.category;

    const sourceColor = (sourceCategory && CATEGORY_HEX[sourceCategory]) || '#888';
    const targetColor = (targetCategory && CATEGORY_HEX[targetCategory]) || '#888';

    const isAttachmentEdge = targetNode?.type === 'attach-node';

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
                {isDropTarget && (
                    <filter id={`edge-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                )}
            </defs>
            {isDropTarget && (
                <path
                    d={edgePath}
                    fill="none"
                    stroke="white"
                    strokeWidth={10}
                    strokeOpacity={0.15}
                    strokeLinecap="round"
                    style={{ pointerEvents: 'none' }}
                />
            )}
            <BaseEdge
                id={id}
                path={edgePath}
                style={{
                    ...style,
                    stroke: isDropTarget ? '#ffffff' : `url(#${gradientId})`,
                    strokeWidth: isDropTarget ? 2.5 : 2,
                    opacity: isDimmed ? 0.4 : 1,
                    transition: 'stroke 0.15s, stroke-width 0.15s, opacity 0.2s',
                    filter: isDropTarget ? `url(#edge-glow-${id})` : undefined,
                    strokeDasharray: isDropTarget ? '6 3' : undefined,
                    ...(isAttachmentEdge && { animationDirection: 'reverse' }),
                }}
            />
            {isDropTarget && (
                <g
                    transform={`translate(${centerX}, ${centerY})`}
                    style={{ pointerEvents: 'none' }}
                >
                    <circle r={11} fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth={1.5} />
                    <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize={14}
                        fontWeight="bold"
                        style={{ userSelect: 'none' }}
                    >
                        +
                    </text>
                </g>
            )}
            <EdgeToolbar
                edgeId={id}
                x={centerX}
                y={centerY}
                isVisible={hoveredEdgeId === id && !isDropTarget}
            >
                <Button
                    className="nodrag nopan !bg-card size-8 opacity-100 duration-0"
                    size={'icon'}
                    variant={'destructiveOutline'}
                    style={{ transform: `scale(${zoom})` }}
                    onClick={deleteEdge}
                >
                    <Trash2 />
                </Button>
            </EdgeToolbar>
        </>
    );
}
