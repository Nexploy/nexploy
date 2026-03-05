'use client';

import { Handle, Position, useReactFlow } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import {
    Bell,
    Container,
    FileKey,
    GitBranch,
    type LucideIcon,
    Rocket,
    Terminal,
    Trash2,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { useState } from 'react';

const iconMap: Record<string, LucideIcon> = {
    GitClone: GitBranch,
    Container,
    Rocket,
    FileKey,
    Terminal,
    Bell,
};

const categoryGlow: Record<string, string> = {
    source: 'shadow-blue-500/20',
    build: 'shadow-orange-500/20',
    deploy: 'shadow-green-500/20',
    utility: 'shadow-yellow-500/20',
    notification: 'shadow-pink-500/20',
};

const categoryBorder: Record<string, string> = {
    source: 'border-blue-500',
    build: 'border-orange-500',
    deploy: 'border-green-500',
    utility: 'border-yellow-500',
    notification: 'border-pink-500',
};

interface BaseNodeProps {
    id: string;
    data: {
        label: string;
        nodeType: string;
        definition: NodeDefinition;
        config: Record<string, unknown>;
        pipelineNodeType: string;
    };
    selected?: boolean;
}

export function BaseNode({ id, data, selected }: BaseNodeProps) {
    const { definition } = data;
    const Icon = iconMap[definition.metadata.icon] ?? Terminal;
    const hasInputs = definition.handles.inputs.length > 0;
    const hasOutputs = definition.handles.outputs.length > 0;
    const [hovered, setHovered] = useState(false);
    const { deleteElements } = useReactFlow();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <div
            className="group relative flex flex-col items-center"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Delete button on hover */}
            <button
                onClick={handleDelete}
                className={cn(
                    'bg-destructive text-destructive-foreground absolute -top-8 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full shadow-lg transition-all duration-150',
                    hovered ? 'scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0',
                )}
            >
                <Trash2 className="size-3" />
            </button>

            {/* Node card */}
            <div
                className={cn(
                    'relative flex size-20 items-center justify-center rounded-2xl border-2 bg-card shadow-lg transition-all duration-150',
                    selected
                        ? cn(
                              'border-2 shadow-xl',
                              categoryBorder[definition.category],
                              categoryGlow[definition.category],
                          )
                        : 'border-border hover:border-accent',
                    hovered && !selected && 'border-accent',
                )}
            >
                {/* Input handle */}
                {hasInputs && (
                    <Handle
                        type="target"
                        position={Position.Left}
                        className="!top-1/2 !-left-[7px] !size-3.5 !rounded-full !border-2 !border-card !bg-base-7 transition-colors hover:!bg-base-9"
                    />
                )}

                {/* Icon */}
                <div
                    className={cn(
                        'flex size-11 items-center justify-center rounded-xl',
                        definition.metadata.color,
                    )}
                >
                    <Icon className="size-6" strokeWidth={1.5} />
                </div>

                {/* Output handle */}
                {hasOutputs && (
                    <Handle
                        type="source"
                        position={Position.Right}
                        className="hover:!bg-primary !top-1/2 !-right-[7px] !size-3.5 !rounded-full !border-2 !border-card !bg-base-7 transition-colors"
                    />
                )}
            </div>

            {/* Label below */}
            <span
                className={cn(
                    'mt-2 max-w-[120px] truncate text-center text-xs font-medium transition-colors',
                    selected ? 'text-foreground' : 'text-muted-foreground',
                )}
            >
                {data.label}
            </span>
        </div>
    );
}
