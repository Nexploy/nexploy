'use client';

import { type ComponentProps, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Variable, X } from 'lucide-react';
import { Input } from '@workspace/ui/components/input';
import { type NodeFieldRef } from '@workspace/typescript-interface/pipeline/nodeFieldRef';
import { isNodeFieldRef } from '@/lib/nodeFieldRef';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { useValidAncestorNodeIds } from '@/contexts/RefValidationContext';

type RefAwareInputProps = Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
    value?: string | NodeFieldRef;
    onChange?: (value: string | NodeFieldRef) => void;
};

export function RefAwareInput({ className, value, onChange, ...rest }: RefAwareInputProps) {
    const t = useTranslations('repository.pipeline');
    const isDraggingOver = useRef(false);
    const validAncestorIds = useValidAncestorNodeIds();

    const isRef = isNodeFieldRef(value);
    const ref = isRef ? (value as NodeFieldRef) : null;
    const isStale =
        isRef && ref !== null && validAncestorIds.size > 0 && !validAncestorIds.has(ref.nodeId);

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        isDraggingOver.current = false;
        const data = e.dataTransfer.getData('application/nexploy-node-ref');
        if (!data) return;
        try {
            const parsedRef = JSON.parse(data) as NodeFieldRef;
            onChange?.(parsedRef);
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
                    'flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs',
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
        <Input
            {...rest}
            value={(value as string) ?? ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn('transition-colors', className)}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        />
    );
}
