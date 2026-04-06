'use client';

import { useTranslations } from 'next-intl';
import { useReactFlow } from '@xyflow/react';
import { useFormContext } from 'react-hook-form';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
import { cn } from '@workspace/ui/lib/utils';
import { FormControl, FormField, FormItem, FormLabel } from '@workspace/ui/components/form';

export function ConditionConfig() {
    const t = useTranslations('repository.pipeline');
    const { getNodes, getEdges } = useReactFlow();
    const panelNodeId = usePipelineEditorStore((s) => s.panelNodeId);
    const form = useFormContext();

    const nodes = getNodes();
    const edges = getEdges();

    const inputNodes = edges
        .filter((e) => e.target === panelNodeId)
        .map((e) => nodes.find((n) => n.id === e.source))
        .filter((n): n is NonNullable<typeof n> => n !== undefined);

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="operator"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('config.conditionMode')}</FormLabel>
                        <FormControl>
                            <div className="border-border bg-muted/30 flex overflow-hidden rounded-md border text-xs">
                                <button
                                    type="button"
                                    onClick={() => field.onChange('and')}
                                    className={cn(
                                        'flex flex-1 flex-col items-center gap-0.5 px-3 py-2 transition-colors',
                                        field.value === 'and'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <span className="font-bold">AND</span>
                                    <span className="text-[10px] opacity-80">
                                        {t('config.conditionModeAndDesc')}
                                    </span>
                                </button>
                                <div className="border-border w-px self-stretch border-l" />
                                <button
                                    type="button"
                                    onClick={() => field.onChange('or')}
                                    className={cn(
                                        'flex flex-1 flex-col items-center gap-0.5 px-3 py-2 transition-colors',
                                        field.value === 'or'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                    )}
                                >
                                    <span className="font-bold">OR</span>
                                    <span className="text-[10px] opacity-80">
                                        {t('config.conditionModeOrDesc')}
                                    </span>
                                </button>
                            </div>
                        </FormControl>
                    </FormItem>
                )}
            />

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
