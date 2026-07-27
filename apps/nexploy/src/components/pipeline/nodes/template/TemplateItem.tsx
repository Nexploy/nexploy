import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { PipelineTemplate } from '@/components/pipeline/nodes/template/pipelineTemplates';
import { FileCode2, Plus } from 'lucide-react';
import {
    NODE_BG_MUTED,
    NODE_ICONS,
    NODE_TEXT,
    TEMPLATE_ICONS,
} from '@/components/pipeline/pipelineTheme';

export function TemplateItem({
    template,
    onClick,
    onDragStart: onDragStartProp,
}: {
    template: PipelineTemplate;
    onClick?: () => void;
    onDragStart?: () => void;
}) {
    const t = useTranslations('repository.pipeline');
    const Icon = TEMPLATE_ICONS[template.icon] ?? FileCode2;

    const onDragStart = (e: React.DragEvent) => {
        onDragStartProp?.();
        e.dataTransfer.setData('application/node-template', template.id);
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className="border-border/60 bg-card hover:border-foreground/15 hover:bg-accent/40 group relative flex cursor-grab flex-col gap-2.5 overflow-hidden rounded-lg border py-2 pl-2.5 pr-1.5 transition-colors active:cursor-grabbing active:opacity-60"
        >
            <span className="bg-primary absolute inset-y-1 left-0 w-0.5 rounded-full opacity-0 transition-opacity group-hover:opacity-100" />

            <div className="flex items-start gap-2.5">
                <div className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
                    <Icon className="size-3.5" strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1 py-px">
                    <span className="text-foreground block truncate text-xs font-medium">
                        {t(`templates.${template.id}.name`)}
                    </span>
                    <span className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] leading-snug">
                        {t(`templates.${template.id}.description`)}
                    </span>
                </div>
                <div className="bg-muted text-muted-foreground group-hover:text-foreground mt-px flex size-5 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100">
                    <Plus className="size-3" strokeWidth={2} />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 pl-0.5">
                {template.nodes.map((node, i) => {
                    const NodeIcon = NODE_ICONS[node.type]!;
                    return (
                        <div key={i} className="flex items-center gap-1">
                            <div
                                className={cn(
                                    'flex size-6 items-center justify-center rounded-md',
                                    NODE_BG_MUTED[node.type],
                                    NODE_TEXT[node.type],
                                )}
                                title={node.type}
                            >
                                <NodeIcon className="size-3" strokeWidth={1.5} />
                            </div>
                            {i < template.nodes.length - 1 && (
                                <div className="bg-border h-px w-3" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
