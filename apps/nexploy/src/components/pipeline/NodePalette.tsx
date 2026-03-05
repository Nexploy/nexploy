'use client';

import { useTranslations } from 'next-intl';
import { getAllNodeDefinitions } from '@/lib/pipeline/nodeRegistry';
import { NodeType } from '@workspace/typescript-interface/pipeline/node';
import {
    Bell,
    Container,
    FileKey,
    GitBranch,
    type LucideIcon,
    Rocket,
    Terminal,
} from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';

const iconMap: Record<string, LucideIcon> = {
    GitClone: GitBranch,
    Container,
    Rocket,
    FileKey,
    Terminal,
    Bell,
};

const categoryLabel: Record<string, string> = {
    source: 'Source',
    build: 'Build',
    deploy: 'Deploy',
    utility: 'Utility',
    notification: 'Notification',
};

export function NodePalette() {
    const t = useTranslations('repository.pipeline');
    const definitions = getAllNodeDefinitions();

    const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const grouped = definitions.reduce<Record<string, typeof definitions>>((acc, def) => {
        if (!acc[def.category]) acc[def.category] = [];
        acc[def.category]!.push(def);
        return acc;
    }, {});

    return (
        <div className="bg-sidebar flex w-48 shrink-0 flex-col gap-3 border-r p-3">
            <p className="text-muted-foreground px-1 text-[10px] font-semibold tracking-widest uppercase">
                {t('palette')}
            </p>
            {Object.entries(grouped).map(([category, defs]) => (
                <div key={category} className="flex flex-col gap-1">
                    <p className="text-muted-foreground px-1 text-[10px] font-medium">
                        {categoryLabel[category] ?? category}
                    </p>
                    {defs.map((def) => {
                        const Icon =
                            (def.metadata.icon ? iconMap[def.metadata.icon] : undefined) ??
                            Terminal;
                        return (
                            <div
                                key={def.type}
                                draggable
                                onDragStart={(e) => onDragStart(e, def.type as NodeType)}
                                className="border-border bg-card hover:border-accent hover:bg-muted flex cursor-grab items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-all active:cursor-grabbing active:opacity-60"
                            >
                                <div
                                    className={cn(
                                        'flex size-7 shrink-0 items-center justify-center rounded-md',
                                        def.metadata.color,
                                    )}
                                >
                                    <Icon className="size-3.5" strokeWidth={1.5} />
                                </div>
                                <span className="text-foreground truncate text-xs font-medium">
                                    {t(`nodes.${def.type}.name`)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
