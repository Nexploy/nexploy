'use client';

import React from 'react';
import { CheckCircle2, CircleX, Loader2, LucideIcon, Power, Trash2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import { type NodeRunStatus } from '@/types/pipeline.type';
import { useReactFlow } from '@xyflow/react';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { CATEGORY_BORDER, CATEGORY_GLOW, ICON_NAME_MAP } from '@/components/pipeline/pipelineTheme';
import { useTranslations } from 'next-intl';

interface NodeWrapperProps {
    id: string;
    data: {
        definition: NodeDefinition;
        nodeType: string;
        disabled?: boolean;
        viewOnly?: boolean;
        runStatus?: NodeRunStatus;
    };
    selected?: boolean;
    className?: string;
    children: React.ReactNode;
}

export function NodeWrapper({
    id,
    data: { runStatus, viewOnly, disabled, definition, nodeType },
    selected,
    className,
    children,
}: NodeWrapperProps) {
    const t = useTranslations('repository.pipeline');
    const Icon = ICON_NAME_MAP[definition.metadata.icon] as LucideIcon;
    const hasAttachHandles = definition.handles.attachments;

    const { deleteElements, getNodes } = useReactFlow();
    const { triggerAutoSave, setNodes } = usePipelineContext();

    const getTargetIds = () => {
        const selectedIds = getNodes()
            .filter((n) => n.selected)
            .map((n) => n.id);
        return selectedIds.length > 1 && selectedIds.includes(id) ? selectedIds : [id];
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: getTargetIds().map((nid) => ({ id: nid })) });
    };

    const handleToggleDisabled = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes((nodes) =>
            nodes.map((node) =>
                getTargetIds().includes(node.id)
                    ? { ...node, data: { ...node.data, disabled: !disabled } }
                    : node,
            ),
        );
        triggerAutoSave();
    };

    return (
        <div
            className={cn(
                'group relative',
                (disabled || runStatus === 'skipped') && 'opacity-40',
                className,
            )}
        >
            {!viewOnly && (
                <div
                    className={cn(
                        'absolute -top-7 left-1/2 flex -translate-x-1/2 items-center gap-1',
                        'scale-75 opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100',
                    )}
                >
                    <Button
                        onClick={handleToggleDisabled}
                        variant="ghost"
                        className={cn(
                            'size-6',
                            disabled
                                ? 'text-muted-foreground hover:text-foreground'
                                : 'text-foreground hover:text-muted-foreground',
                        )}
                    >
                        <Power className="size-3" />
                    </Button>
                    <Button onClick={handleDelete} variant="destructiveGhost" className="size-6">
                        <Trash2 className="size-3" />
                    </Button>
                </div>
            )}

            <div
                className={cn(
                    'bg-card relative flex items-center gap-3 rounded-2xl border-2 p-4 shadow-lg transition-all duration-300',
                    definition.isStartNode ? 'rounded-l-4xl rounded-r-2xl' : 'rounded-2xl',
                    runStatus === 'running' &&
                        'animate-pulse border-amber-500 shadow-xl shadow-amber-500/40',
                    runStatus === 'completed' && 'border-green-500 shadow-xl shadow-green-500/30',
                    runStatus === 'failed' && 'border-red-500 shadow-xl shadow-red-500/30',
                    runStatus === 'skipped' && 'border-muted',
                    !runStatus &&
                        (selected
                            ? cn(
                                  'shadow-xl',
                                  CATEGORY_BORDER[definition.category],
                                  CATEGORY_GLOW[definition.category],
                              )
                            : 'border-border hover:border-accent'),
                )}
            >
                {runStatus === 'running' && (
                    <Loader2 className="absolute top-1 right-1 size-4 animate-spin text-amber-500" />
                )}
                {runStatus === 'completed' && (
                    <CheckCircle2 className="absolute top-1 right-1 size-4 text-green-500" />
                )}
                {runStatus === 'failed' && (
                    <CircleX className="absolute top-1 right-1 size-4 text-red-500" />
                )}
                <div
                    className={cn(
                        'flex size-11 items-center justify-center rounded-xl',
                        definition.metadata.color,
                    )}
                >
                    <Icon className="size-6" strokeWidth={1.5} />
                </div>
                {children}
                {hasAttachHandles && (
                    <span
                        className={cn(
                            'text-xs font-medium',
                            selected ? 'text-foreground' : 'text-muted-foreground',
                        )}
                    >
                        {t(`nodes.${nodeType}.name`)}
                    </span>
                )}
            </div>
            {!hasAttachHandles && (
                <span
                    className={cn(
                        'mt-2 max-w-[120px] text-center text-xs font-medium transition-colors',
                        selected ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {t(`nodes.${nodeType}.name`)}
                </span>
            )}
        </div>
    );
}
