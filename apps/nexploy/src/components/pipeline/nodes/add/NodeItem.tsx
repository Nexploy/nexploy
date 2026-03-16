'use client';

import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { NodeId } from '@workspace/typescript-interface/pipeline/node';
import { cn } from '@workspace/ui/lib/utils';
import { Terminal } from 'lucide-react';
import { ICON_NAME_MAP } from '@/components/pipeline/pipelineTheme';

export function NodeItem({
    def,
    label,
    onDragStart,
    onClick,
}: {
    def: NodeDefinition;
    label: string;
    onDragStart: (e: React.DragEvent, nodeType: NodeId) => void;
    onClick?: () => void;
}) {
    const Icon = (def.metadata.icon ? ICON_NAME_MAP[def.metadata.icon] : undefined) ?? Terminal;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, def.id as NodeId)}
            onClick={onClick}
            className="border-border bg-card hover:bg-muted flex cursor-grab items-center gap-2.5 rounded-lg border px-1.5 py-1.5 transition-all active:cursor-grabbing active:opacity-60"
        >
            <div
                className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-md',
                    def.metadata.color,
                )}
            >
                <Icon className="size-3.5" strokeWidth={1.5} />
            </div>
            <span className="text-foreground truncate text-xs font-medium">{label}</span>
        </div>
    );
}
