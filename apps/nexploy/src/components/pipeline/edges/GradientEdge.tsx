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
import { type NodeDefinition } from '@nexploy/nodes/ui/nodeDefinition';
import { type NodeData } from '@nexploy/nodes/ui/nodeDefinition';
import { CATEGORY_HEX } from '@/components/pipeline/pipelineTheme';
import { Trash2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { usePipelineEditorStore } from '@/stores/pipeline/usePipelineEditorStore';

type EdgeRunStatus = 'running' | 'completed' | 'skipped' | 'failed' | 'cancelled' | 'not-configured';

export function GradientEdge(props: EdgeProps) {
    const { id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, data } =
        props;

    const nodes = useNodes();
    const { deleteElements, getEdges } = useReactFlow();
    const { zoom } = useViewport();
    const hoveredEdgeId = usePipelineEditorStore((s) => s.hoveredEdgeId);

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

    const sourceStatus = (data as { sourceStatus?: EdgeRunStatus } | undefined)?.sourceStatus;
    const targetStatus = (data as { targetStatus?: EdgeRunStatus } | undefined)?.targetStatus;
    const isBuildView = 'sourceStatus' in ((data ?? {}) as object);

    const hasFailed = sourceStatus === 'failed' || sourceStatus === 'cancelled';
    const hasFlowed = sourceStatus === 'completed' || sourceStatus === 'running';
    const isPending = isBuildView && !hasFailed && !hasFlowed;
    const showPulse = sourceStatus === 'completed' && targetStatus === 'running';

    const strokeColor = hasFailed ? 'var(--destructive)' : `url(#${gradientId})`;

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
                    stroke: strokeColor,
                    strokeWidth: 2,
                    strokeDasharray: hasFailed ? '6 6' : undefined,
                    opacity: isDimmed ? 0.4 : isPending ? 0.45 : 1,
                    transition: 'opacity 0.2s, stroke 0.3s',
                    ...(isAttachmentEdge && { animationDirection: 'reverse' }),
                }}
            />
            {showPulse && (
                <circle r={4} fill={targetColor}>
                    <animateMotion dur="1.6s" repeatCount="indefinite" path={edgePath} />
                </circle>
            )}
            <EdgeToolbar edgeId={id} x={centerX} y={centerY} isVisible={hoveredEdgeId === id}>
                <Button
                    className="nodrag nopan size-8 bg-card! opacity-100 duration-0"
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
