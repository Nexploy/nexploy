'use client';

import { useTranslations } from 'next-intl';
import { getAllNodeDefinitions } from '@/lib/pipeline/nodeRegistry';
import { NodeType } from '@workspace/typescript-interface/pipeline/node';
import {
    Bell,
    Container,
    FileKey,
    GitBranch,
    Rocket,
    Terminal,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

const iconMap: Record<string, LucideIcon> = {
    GitClone: GitBranch,
    Container: Container,
    Rocket: Rocket,
    FileKey: FileKey,
    Terminal: Terminal,
    Bell: Bell,
};

export function NodePalette() {
    const t = useTranslations('repository.pipeline');
    const definitions = getAllNodeDefinitions();

    const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="flex w-52 shrink-0 flex-col gap-2 overflow-y-auto p-3">
            <p className="text-muted-foreground px-1 text-xs font-medium uppercase tracking-wider">
                {t('palette')}
            </p>
            <div className="flex flex-col gap-1.5">
                {definitions.map((def) => {
                    const Icon = iconMap[def.metadata.icon] ?? Terminal;
                    return (
                        <div
                            key={def.type}
                            draggable
                            onDragStart={(e) => onDragStart(e, def.type as NodeType)}
                            className="border-border bg-card hover:bg-accent flex cursor-grab items-center gap-2 rounded-md border p-2 transition-colors active:cursor-grabbing"
                        >
                            <div
                                className={cn(
                                    'flex size-7 shrink-0 items-center justify-center rounded',
                                    def.metadata.color,
                                )}
                            >
                                <Icon className="size-3.5" />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-medium">
                                    {t(`nodes.${def.type as NodeType}.name` as Parameters<typeof t>[0])}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
