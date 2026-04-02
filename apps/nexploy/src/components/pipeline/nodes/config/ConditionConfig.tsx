'use client';

import { useTranslations } from 'next-intl';
import { useReactFlow } from '@xyflow/react';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
import { cn } from '@workspace/ui/lib/utils';

export function ConditionConfig() {
    const t = useTranslations('repository.pipeline');
    const { getNodes, getEdges } = useReactFlow();
    const panelNodeId = usePipelineEditorStore((s) => s.panelNodeId);

    const nodes = getNodes();
    const edges = getEdges();

    const inputNodes = edges
        .filter((e) => e.target === panelNodeId)
        .map((e) => nodes.find((n) => n.id === e.source))
        .filter((n): n is NonNullable<typeof n> => n !== undefined);

    return (
        <div className="space-y-3">
            <p className="text-muted-foreground text-xs">{t('nodes.condition.description')}</p>
            <div className="space-y-1.5">
                <p className="text-xs font-medium">{t('config.conditionInputNodes')}</p>
                {inputNodes.length === 0 ? (
                    <p className="text-muted-foreground text-xs italic">
                        {t('config.conditionNoInputs')}
                    </p>
                ) : (
                    inputNodes.map((node) => {
                        const data = node.data as unknown as NodeData;
                        const Icon = data.definition?.metadata.icon;

                        return (
                            <div
                                key={node.id}
                                className="border-border bg-muted/40 flex items-center gap-2 rounded-md border px-2 py-1.5"
                            >
                                <div
                                    className={cn(
                                        'flex size-5 shrink-0 items-center justify-center rounded-sm',
                                        data.definition?.metadata.color,
                                    )}
                                >
                                    <Icon className="size-3" strokeWidth={1.5} />
                                </div>
                                <span className="text-foreground text-xs font-medium">
                                    {t(`nodes.${data.nodeType}.name`)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
