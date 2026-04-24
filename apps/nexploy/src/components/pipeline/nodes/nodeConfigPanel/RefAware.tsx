'use client';

import { type PropsWithChildren } from 'react';
import { type NodeFieldRef } from '@workspace/typescript-interface/pipeline/nodeFieldRef';
import { isNodeFieldRef } from '@/lib/nodeFieldRef';
import { AlertTriangle, Variable, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import { useValidAncestorNodeIds } from '@/contexts/RefValidationContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface RefAwareProps {
    value: string | NodeFieldRef;
    onChange: (value: string | NodeFieldRef) => void;
    emptyValue?: string;
    className?: string;
}

export function RefAware({
    value,
    onChange,
    emptyValue = '',
    className,
    children,
}: PropsWithChildren<RefAwareProps>) {
    const tPipeline = useTranslations('repository.pipeline');
    const tRepository = useTranslations('repository');
    const validAncestorIds = useValidAncestorNodeIds();

    const ref = isNodeFieldRef(value) ? value : null;
    const isRef = ref !== null;
    const isStale = isRef && validAncestorIds.size > 0 && !validAncestorIds.has(ref.nodeId);

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/nexploy-node-ref');
        if (!data) return;
        try {
            const parsed = JSON.parse(data) as NodeFieldRef;
            onChange({
                nodeId: parsed.nodeId,
                inputKey: parsed.inputKey,
                labelKey: parsed.labelKey,
            });
        } catch {}
    };

    const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
        if (e.dataTransfer.types.includes('application/nexploy-node-ref')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    };

    if (isRef && ref) {
        const badge = (
            <div
                className={cn(
                    'flex h-9 items-center gap-1.5 rounded-md border px-2 text-xs',
                    'border-dashed',
                    isStale && 'border-destructive/60 bg-destructive/10 text-destructive',
                    className,
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {isStale ? (
                    <AlertTriangle className="text-destructive size-3 shrink-0" />
                ) : (
                    <Variable className="size-3 shrink-0 text-amber-400" />
                )}
                <span className="flex-1 truncate font-mono">{tRepository(ref.labelKey)}</span>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onChange(emptyValue)}
                    className={cn(
                        'size-5 shrink-0 transition-colors',
                        isStale
                            ? 'text-destructive hover:text-destructive'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                    aria-label={tPipeline('clearRef')}
                >
                    <X className="size-3" />
                </Button>
            </div>
        );

        if (isStale) {
            return (
                <Tooltip>
                    <TooltipTrigger asChild>{badge}</TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        {tPipeline('staleRef')}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return badge;
    }

    return (
        <div className={className} onDrop={handleDrop} onDragOver={handleDragOver}>
            {children}
        </div>
    );
}
