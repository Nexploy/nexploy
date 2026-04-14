'use client';

import { PropsWithChildren } from 'react';
import { type NodeFieldRef } from '@workspace/typescript-interface/pipeline/nodeFieldRef';
import { parseRefString, stringifyRef } from '@/lib/nodeFieldRef';
import { AlertTriangle, Variable, X } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';
import { useTranslations } from 'next-intl';
import { useValidAncestorNodeIds } from '@/contexts/RefValidationContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface RefAwareProps {
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
}

export function RefAware({
    value,
    onChange,
    className,
    children,
}: PropsWithChildren<RefAwareProps>) {
    const t = useTranslations('repository.pipeline');
    const validAncestorIds = useValidAncestorNodeIds();

    const ref = parseRefString(value);
    const isRef = ref !== null;
    const isStale = isRef && validAncestorIds.size > 0 && !validAncestorIds.has(ref.nodeId);

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/nexploy-node-ref');
        if (!data) return;
        try {
            const parsed = JSON.parse(data) as NodeFieldRef;
            onChange?.(stringifyRef(parsed));
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
                    isStale
                        ? 'border-destructive/60 bg-destructive/10 text-destructive'
                        : 'border-border bg-muted/30',
                    className,
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {isStale ? (
                    <AlertTriangle className="text-destructive size-3 shrink-0" />
                ) : (
                    <Variable className="text-primary size-3 shrink-0" />
                )}
                <span className="flex-1 truncate font-mono">{ref.inputKey}</span>
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onChange?.('')}
                    className={cn(
                        'size-5 shrink-0 transition-colors',
                        isStale
                            ? 'text-destructive hover:text-destructive'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                    aria-label={t('clearRef')}
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
                        {t('staleRef')}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return badge;
    }

    return (
        <div onDrop={handleDrop} onDragOver={handleDragOver}>
            {children}
        </div>
    );
}
