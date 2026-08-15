'use client';

import { NodeDefinition } from '@nexploy/nodes/ui/nodeDefinition';
import { NodeId } from '@nexploy/nodes/core/node';
import { cn } from '@workspace/ui/lib/utils';
import { Plus } from 'lucide-react';
import { CATEGORY_BG } from '@/components/pipeline/pipelineTheme';

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
            className="group relative flex cursor-grab items-start gap-2.5 overflow-hidden rounded-lg border border-border/60 bg-card py-2 pr-1.5 pl-2.5 transition-colors hover:border-foreground/15 hover:bg-accent/40 active:cursor-grabbing active:opacity-60"
        >
            <span
                className={cn(
                    'absolute inset-y-1 left-0 w-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100',
                    CATEGORY_BG[def.category],
                )}
            />

            <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-md', def.metadata.color)}>
                <Icon className="size-3.5" strokeWidth={1.6} />
            </div>

            <div className="min-w-0 flex-1 py-px">
                <span className="block truncate font-medium text-foreground text-xs">{label}</span>
                {description && (
                    <span className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground leading-snug">
                        {description}
                    </span>
                )}
            </div>

            <div className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground opacity-0 transition-opacity group-hover:text-foreground group-hover:opacity-100">
                <Plus className="size-3" strokeWidth={2} />
            </div>
        </div>
    );
}
