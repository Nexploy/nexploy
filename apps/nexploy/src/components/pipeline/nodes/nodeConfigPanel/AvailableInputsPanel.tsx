'use client';

import { useTranslations } from 'next-intl';
import { Variable } from 'lucide-react';
import { type NodeFieldRef } from '@workspace/typescript-interface/pipeline/nodeFieldRef';
import { useAncestorInputFields } from '@/hooks/useAncestorInputFields';
import { type NodeInputField } from '@/components/pipeline/types/nodeManifest';
import { cn } from '@workspace/ui/lib/utils';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';

interface InputChipProps {
    nodeId: string;
    nodeType: string;
    field: NodeInputField;
}

function InputChip({ nodeId, nodeType, field }: InputChipProps) {
    const ref: NodeFieldRef = {
        nodeId,
        inputKey: field.key,
        nodeType,
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/nexploy-node-ref', JSON.stringify(ref));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className={cn(
                'group relative flex cursor-grab items-center gap-2 rounded-lg border px-2.5 py-2 text-xs',
                'bg-background hover:border-amber-400/30 hover:bg-amber-400/10 active:cursor-grabbing',
                'transition-all duration-150 select-none',
            )}
        >
            <Variable className="size-3 shrink-0 text-amber-400/60 group-hover:text-amber-400" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{field.key}</span>
        </div>
    );
}

interface AvailableInputsPanelProps {
    nodeId: string;
}

export function AvailableInputsPanel({ nodeId }: AvailableInputsPanelProps) {
    const t = useTranslations('repository.pipeline');
    const ancestors = useAncestorInputFields(nodeId);

    return (
        <div className="flex w-56 flex-col gap-4 overflow-hidden p-3">
            <div>
                <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-md bg-amber-400/10">
                        <Variable className="size-3.5 text-amber-400" />
                    </div>
                    <span className="text-foreground text-sm font-semibold">
                        {t('availableInputs')}
                    </span>
                </div>
                <p className="text-muted-foreground mt-1.5 text-[11px] leading-relaxed">
                    {t('dragHint')}
                </p>
            </div>

            {!ancestors.length ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 pb-24 text-center">
                    <div className="flex size-6 items-center justify-center rounded-md bg-amber-400/10">
                        <Variable className="size-3.5 text-amber-400" />
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                        {t('noInputsAvailable')}
                    </p>
                </div>
            ) : (
                <ScrollAreaWithShadow bottomShadow className="min-h-0 flex-1 overflow-hidden">
                    <div className="flex flex-col gap-3">
                        {ancestors.map(({ nodeId: ancestorId, nodeType, inputFields }, index) => (
                            <div key={ancestorId} className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="bg-muted text-muted-foreground flex size-4 shrink-0 items-center justify-center rounded text-[9px] font-bold">
                                        {index + 1}
                                    </span>
                                    <p className="text-muted-foreground truncate text-[10px] font-medium tracking-wide uppercase">
                                        {t(`nodes.${nodeType}.name`)}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {inputFields.map((field) => (
                                        <InputChip
                                            key={field.key}
                                            nodeId={ancestorId}
                                            nodeType={nodeType}
                                            field={field}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollAreaWithShadow>
            )}
        </div>
    );
}
