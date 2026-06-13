'use client';

import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { NodeId } from '@workspace/typescript-interface/pipeline/node';
import { cn } from '@workspace/ui/lib/utils';

export function NodeItem({
    def,
    label,
    description,
    onDragStart,
    onClick,
}: {
    def: NodeDefinition;
    label: string;
    description?: string;
    onDragStart: (e: React.DragEvent, nodeType: NodeId) => void;
    onClick?: () => void;
}) {
    const Icon = def.metadata.icon;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, def.id)}
            onClick={onClick}
            className="border-border bg-card hover:border-foreground/15 hover:bg-muted relative flex cursor-grab items-center gap-2.5 rounded-lg border p-2 active:cursor-grabbing active:opacity-60"
        >
            <div
                className={cn(
                    'flex size-8 shrink-0 items-center justify-center self-start rounded-md',
                    def.metadata.color,
                )}
            >
                <Icon className="size-4" strokeWidth={1.5} />
            </div>

            <div className="flex flex-col gap-1">
                <span className="text-foreground block text-xs font-medium">{label}</span>
                {description && (
                    <span className="text-muted-foreground block text-[11px] leading-snug">
                        {description}
                    </span>
                )}
            </div>
        </div>
    );
}
