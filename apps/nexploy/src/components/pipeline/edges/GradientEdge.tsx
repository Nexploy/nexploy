'use client';

import { BaseEdge, type EdgeProps, getBezierPath } from '@xyflow/react';
import { type NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { usePipelineContext } from '@/contexts/PipelineContext';

const categoryColors: Record<string, string> = {
    source: '#3b82f6',
    build: '#f97316',
    deploy: '#22c55e',
    utility: '#eab308',
    notification: '#ec4899',
};

export function GradientEdge({
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
}: EdgeProps) {
    const { nodes } = usePipelineContext();

    const sourceNode = nodes.find((n) => n.id === source);
    const targetNode = nodes.find((n) => n.id === target);

    const sourceCategory = (sourceNode?.data?.definition as NodeDefinition)?.category;
    const targetCategory = (targetNode?.data?.definition as NodeDefinition)?.category;

    const sourceColor = sourceCategory && categoryColors[sourceCategory];
    const targetColor = targetCategory && categoryColors[targetCategory];

    const gradientId = `edge-gradient-${id}`;

    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

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
        </>
    );
}
