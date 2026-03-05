'use client';

import { Handle, Position } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import {
    Bell,
    Container,
    FileKey,
    GitBranch,
    Rocket,
    Terminal,
    LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    GitClone: GitBranch,
    Container: Container,
    Rocket: Rocket,
    FileKey: FileKey,
    Terminal: Terminal,
    Bell: Bell,
};

interface BaseNodeProps {
    data: {
        label: string;
        nodeType: string;
        definition: NodeDefinition;
    };
    selected?: boolean;
}

export function BaseNode({ data, selected }: BaseNodeProps) {
    const { label, definition } = data;
    const Icon = iconMap[definition.metadata.icon] ?? Terminal;
    const hasInputs = definition.handles.inputs.length > 0;
    const hasOutputs = definition.handles.outputs.length > 0;

    return (
        <div
            className={cn(
                'bg-card relative w-56 rounded-lg border-2 px-3 py-2.5 shadow-sm transition-all',
                selected ? 'border-primary' : 'border-border',
            )}
        >
            {hasInputs && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!bg-muted-foreground !w-3 !h-3 !border-2 !border-background"
                />
            )}

            <div className="flex items-center gap-2">
                <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', definition.metadata.color)}>
                    <Icon className="size-4" />
                </div>
                <span className="text-sm font-medium leading-tight">{label}</span>
            </div>

            {hasOutputs && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!bg-primary !w-3 !h-3 !border-2 !border-background"
                />
            )}
        </div>
    );
}
