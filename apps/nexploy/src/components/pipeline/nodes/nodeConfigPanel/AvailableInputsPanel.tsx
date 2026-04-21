'use client';

import { useTranslations } from 'next-intl';
import { Variable } from 'lucide-react';
import { useAncestorInputFields } from '@/hooks/useAncestorInputFields';
import { type NodeInputField } from '@/components/pipeline/types/nodeManifest';
import { cn } from '@workspace/ui/lib/utils';
import { ScrollAreaWithShadow } from '@workspace/ui/components/scroll-area-with-shadow';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { NodeFieldRef } from '@workspace/typescript-interface/pipeline/nodeFieldRef.ts';

interface InputChipProps {
    nodeId: string;
    nodeType: string;
    field: NodeInputField;
}

function InputChip({ nodeId, nodeType, field }: InputChipProps) {
    const tRepository = useTranslations('repository');

    const ref: NodeFieldRef = {
        nodeId,
        inputKey: field.key,
        labelKey: field.labelKey,
        nodeType,
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('application/nexploy-node-ref', JSON.stringify(ref));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const chip = (
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
            <span className="font-mono text-xs">{tRepository(field.labelKey)}</span>
        </div>
    );

    if (!field.descriptionKey) return chip;

    return (
        <Tooltip>
            <TooltipTrigger asChild>{chip}</TooltipTrigger>
            <TooltipContent side="left" className="max-w-52 text-xs">
                {tRepository(field.descriptionKey)}
            </TooltipContent>
        </Tooltip>
    );
}

interface AvailableInputsPanelProps {
    nodeId: string;
}

export function AvailableInputsPanel({ nodeId }: AvailableInputsPanelProps) {
    const t = useTranslations('repository.pipeline');
    const ancestors = useAncestorInputFields(nodeId);

    return (
        <div className="flex w-56 flex-col gap-2 overflow-hidden">
            <div className={'flex flex-col gap-1.5 p-3 pb-0'}>
                <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-md bg-amber-400/10">
                        <Variable className="size-3.5 text-amber-400" />
                    </div>
                    <span className="text-foreground text-sm font-semibold">
                        {t('availableInputs')}
                    </span>
                </div>
                <p className="text-muted-foreground text-[11px]">{t('dragHint')}</p>
            </div>

            {!ancestors.length ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 pb-24 text-center">
                    <div className="flex size-6 items-center justify-center rounded-md bg-amber-400/10">
                        <Variable className="size-3.5 text-amber-400" />
                    </div>
                    <p className="text-muted-foreground text-xs">{t('noInputsAvailable')}</p>
                </div>
            ) : (
                <ScrollAreaWithShadow bottomShadow className="h-full overflow-hidden">
                    <div className="flex flex-col gap-3 p-3 pt-0">
                        {ancestors.map(({ nodeId, nodeType, inputFields }, index) => (
                            <div key={nodeId + index} className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                    <span className="bg-muted text-muted-foreground flex size-4 shrink-0 items-center justify-center rounded text-[9px] font-bold">
                                        {index + 1}
                                    </span>
                                    <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
                                        {t(`nodes.${nodeType}.name`)}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {inputFields.map((field) => (
                                        <InputChip
                                            key={field.key}
                                            nodeId={nodeId}
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
