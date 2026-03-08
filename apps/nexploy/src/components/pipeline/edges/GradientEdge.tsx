'use client';

import { BaseEdge, type EdgeProps, getBezierPath, useNodes } from '@xyflow/react';
import { type NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_HEX } from '@/components/pipeline/pipelineTheme';
import { type NodeRunStatus } from '@/types/pipeline.type';

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
    const nodes = useNodes();

    const sourceNode = nodes.find((n) => n.id === source);
    const targetNode = nodes.find((n) => n.id === target);

    const sourceCategory = (sourceNode?.data?.definition as NodeDefinition)?.category;
    const targetCategory = (targetNode?.data?.definition as NodeDefinition)?.category;

    const sourceColor = (sourceCategory && CATEGORY_HEX[sourceCategory]) || '#888';
    const targetColor = (targetCategory && CATEGORY_HEX[targetCategory]) || '#888';

    const sourceRunStatus = sourceNode?.data?.runStatus as NodeRunStatus | undefined;
    const targetRunStatus = targetNode?.data?.runStatus as NodeRunStatus | undefined;
    const isAnimated =
        sourceRunStatus === 'running' ||
        (sourceRunStatus === 'completed' && targetRunStatus === 'running');

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
            {isAnimated && (
                <path
                    d={edgePath}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={3}
                    strokeDasharray="6 5"
                    strokeLinecap="round"
                    opacity={0.9}
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-11"
                        dur="0.5s"
                        repeatCount="indefinite"
                    />
                </path>
            )}
        </>
    );
}
