'use client';

import { useTranslations } from 'next-intl';
import { ArrowRightFromLine } from 'lucide-react';
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
import { getNodeInputFields } from '@/components/pipeline/nodeManifestRegistry';
import { type Node } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';

interface OutputChipProps {
    label: string;
}

function OutputChip({ label }: OutputChipProps) {
    return (
        <div
            className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs',
                'bg-background',
            )}
        >
            <ArrowRightFromLine className="size-3 shrink-0 text-emerald-400/60" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{label}</span>
        </div>
    );
}

interface NodeOutputsPanelProps {
    node: Node;
}

export function NodeOutputsPanel({ node }: NodeOutputsPanelProps) {
    const t = useTranslations('repository.pipeline');
    const nodeData = node.data as unknown as NodeData;
    const outputFields = getNodeInputFields(nodeData.nodeType);

    return (
        <div className="flex w-56 flex-col gap-4 overflow-hidden p-3">
            <div>
                <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-md bg-emerald-400/10">
                        <ArrowRightFromLine className="size-3.5 text-emerald-400" />
                    </div>
                    <span className="text-foreground text-sm font-semibold">
                        {t('nodeOutputs')}
                    </span>
                </div>
                <p className="text-muted-foreground mt-1.5 text-[11px] leading-relaxed">
                    {t('nodeOutputsHint')}
                </p>
            </div>

            {!outputFields?.length ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 pb-24 text-center">
                    <div className="flex size-6 items-center justify-center rounded-md bg-emerald-400/10">
                        <ArrowRightFromLine className="size-3.5 text-emerald-400" />
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        {t('noOutputs')}
                    </p>
                </div>
            ) : (
                <ScrollAreaWithShadow bottomShadow className="min-h-0 flex-1 overflow-hidden">
                    <div className="flex flex-col gap-1.5">
                        {outputFields.map((field) => (
                            <OutputChip key={field.key} label={field.key} />
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            )}
        </div>
    );
}
