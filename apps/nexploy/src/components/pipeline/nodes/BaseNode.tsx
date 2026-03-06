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
import { Button } from '@workspace/ui/components/button';

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
    const { deleteElements } = useReactFlow();

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <div className="group relative flex flex-col items-center">
            <Button
                onClick={handleDelete}
                variant="destructiveGhost"
                className={cn(
                    'absolute -top-7 left-1/2 flex size-6 -translate-x-1/2 transition-all duration-150',
                    'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 hover:scale-100',
                )}
            >
                <Trash2 className="size-3" />
            </Button>

            <div
                className={cn(
                    'bg-card relative flex size-20 items-center justify-center rounded-2xl border-2 shadow-lg transition-all duration-150',
                    selected
                        ? cn(
                              'border-2 shadow-xl',
                              categoryBorder[definition.category],
                              categoryGlow[definition.category],
                          )
                        : 'border-border hover:border-accent',
                )}
            >
                {hasInputs && (
                    <Handle
                        type="target"
                        position={Position.Left}
                        className="hover:!bg-primary !border-card !bg-base-7 !-left-[3px] !size-4.5 !rounded-full !border-2 transition-all hover:!size-6"
                    />
                )}

                <div
                    className={cn(
                        'flex size-11 items-center justify-center rounded-xl',
                        definition.metadata.color,
                    )}
                >
                    <Icon className="size-6" strokeWidth={1.5} />
                </div>

                {hasOutputs && (
                    <Handle
                        type="source"
                        position={Position.Right}
                        className={cn(
                            'hover:!bg-primary !border-card !bg-base-7 !-right-[3px] !size-4.5 !rounded-full !border-2 transition-all hover:!size-6',
                            `hover:${categoryBorder[definition.category]}`,
                        )}
                    />
                )}
            </div>

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
