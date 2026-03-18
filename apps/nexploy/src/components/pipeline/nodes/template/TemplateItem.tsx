import { useTranslations } from 'next-intl';
import { cn } from '@workspace/ui/lib/utils';
import { PipelineTemplate } from '@/components/pipeline/nodes/template/pipelineTemplates';
import { FileCode2, Terminal } from 'lucide-react';
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
            className="border-border bg-card hover:border-accent hover:bg-muted flex cursor-grab flex-col gap-3 overflow-hidden rounded-lg border p-3 transition-all active:cursor-grabbing active:opacity-60"
        >
            <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-md">
                    <Icon className="size-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                    <p className="text-foreground truncate text-xs font-semibold">
                        {t(`templates.${template.id}.name` as never)}
                    </p>
                    <p className="text-muted-foreground truncate text-[10px]">
                        {t(`templates.${template.id}.description` as never)}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1">
                {template.nodes.map((node, i) => {
                    const NodeIcon = NODE_ICONS[node.type] ?? Terminal;
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
