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
        __nexploy_ref: true,
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
                'flex cursor-grab items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs',
                'bg-background hover:bg-muted active:cursor-grabbing',
                'transition-colors select-none',
            )}
        >
            <Variable className="text-primary size-3 shrink-0" />
            <span className="font-mono">{field.key}</span>
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
        <div className="flex w-[35%] flex-col gap-2 py-3">
            <div className={'flex flex-col'}>
                <span className="text-foreground shrink-0 px-4 text-sm font-semibold">
                    {t('availableInputs')}
                </span>
                <p className="text-muted-foreground shrink-0 px-4 text-[11px]">{t('dragHint')}</p>
            </div>
            {ancestors.length === 0 && (
                <p className="text-muted-foreground border-y border-dashed p-1 text-center text-xs">
                    {t('noInputsAvailable')}
                </p>
            )}
            <ScrollAreaWithShadow bottomShadow className={'h-full overflow-hidden'}>
                <div className="flex flex-col gap-4 px-4">
                    {ancestors.map(({ nodeId: ancestorId, nodeType, inputFields }, index) => (
                        <div key={ancestorId} className="space-y-1.5">
                            <p className="text-muted-foreground flex items-center gap-2 truncate text-[10px] font-medium tracking-wider uppercase">
                                {index + 1}) {t(`nodes.${nodeType}.name`)}
                            </p>
                            <div className="space-y-1">
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
        </div>
    );
}
