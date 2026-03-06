'use client';

import { getAllNodeDefinitions } from '@/lib/pipeline/nodeRegistry';
import { NodeType } from '@workspace/typescript-interface/pipeline/node';
import { cn } from '@workspace/ui/lib/utils';
import {
    Bell,
    Container,
    FileKey,
    GitBranch,
    type LucideIcon,
    Rocket,
    Terminal,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
    GitClone: GitBranch,
    Container,
    Rocket,
    FileKey,
    Terminal,
    Bell,
};

export function NodeItem({
    def,
    label,
    onDragStart,
}: {
    def: ReturnType<typeof getAllNodeDefinitions>[number];
    label: string;
    onDragStart: (e: React.DragEvent, nodeType: NodeType) => void;
}) {
    const Icon = (def.metadata.icon ? iconMap[def.metadata.icon] : undefined) ?? Terminal;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, def.type as NodeType)}
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
