'use client';

import React from 'react';
import { Handle, Position, useConnection, useNodeConnections, useReactFlow } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { useTranslations } from 'next-intl';
import { CheckCircle2, CircleX, Loader2, Power, Terminal, Trash2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import {
    CATEGORY_BG,
    CATEGORY_BORDER,
    CATEGORY_GLOW,
    ICON_NAME_MAP,
} from '@/components/pipeline/pipelineTheme';
import { type NodeRunStatus } from '@/types/pipeline.type';
import { usePipelineContext } from '@/contexts/PipelineContext';

interface CardNodeProps {
    id: string;
    data: {
        label: string;
        nodeType: string;
        definition: NodeDefinition;
        config: Record<string, unknown>;
        disabled?: boolean;
        viewOnly?: boolean;
        runStatus?: NodeRunStatus;
    };
    selected?: boolean;
}

export function AttachNode({ id, data, selected }: CardNodeProps) {
    const { definition } = data;
    const t = useTranslations('repository.pipeline');
    const Icon = ICON_NAME_MAP[definition.metadata.icon] ?? Terminal;
    const hasInputs = definition.handles.inputs.length > 0;
    const hasOutputs = definition.handles.outputs.length > 0;
    const attachments = definition.handles.attachments ?? [];
    const { deleteElements, getNodes } = useReactFlow();
    const { triggerAutoSave, setNodes } = usePipelineContext();
    const disabled = data.disabled ?? false;
    const viewOnly = data.viewOnly ?? false;
    const runStatus = data.runStatus;

    const getTargetIds = () => {
        const selectedIds = getNodes()
            .filter((n) => n.selected)
            .map((n) => n.id);
        return selectedIds.length > 1 && selectedIds.includes(id) ? selectedIds : [id];
    };

    const connection = useConnection();
    const inputConnections = useNodeConnections({ handleType: 'target' });
    const outputConnections = useNodeConnections({ handleType: 'source' });
    const handleColor = CATEGORY_BG[definition.category];

    const isTargetHighlighted =
        connection.inProgress && connection.toNode?.id === id && connection.isValid;
    const isSourceConnecting = connection.inProgress && connection.fromNode?.id === id;

    const inputActive = inputConnections.length > 0 || isTargetHighlighted;
    const outputActive = outputConnections.length > 0 || isSourceConnecting;

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
            className={cn('group relative', (disabled || runStatus === 'skipped') && 'opacity-40')}
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
                    'bg-card relative flex h-20 items-center gap-3 rounded-2xl border-2 px-4 shadow-lg transition-all duration-300',
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
                    <Loader2 className="absolute top-1.5 right-1.5 size-3.5 animate-spin text-amber-500" />
                )}
                {runStatus === 'completed' && (
                    <CheckCircle2 className="absolute top-1.5 right-1.5 size-3.5 text-green-500" />
                )}
                {runStatus === 'failed' && (
                    <CircleX className="absolute top-1.5 right-1.5 size-3.5 text-red-500" />
                )}

                {hasInputs && (
                    <Handle
                        type="target"
                        position={Position.Left}
                        className={cn(
                            '!bg-base-7 !border-card !-left-[3px] !size-4.5 !rounded-full !border-2 transition-all hover:!size-6',
                            inputActive && handleColor,
                        )}
                    />
                )}

                <div
                    className={cn(
                        'flex size-11 items-center justify-center rounded-xl',
                        definition.metadata.color,
                    )}
                >
                    <Icon className="size-6" strokeWidth={1.5} />
                </div>

                <span
                    className={cn(
                        'text-xs font-medium',
                        selected ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {t(`nodes.${data.nodeType}.name`)}
                </span>

                {hasOutputs && (
                    <Handle
                        type="source"
                        position={Position.Right}
                        className={cn(
                            '!bg-base-7 !border-card !-right-[3px] !size-4.5 !rounded-full !border-2 transition-all hover:!size-6',
                            outputActive && handleColor,
                        )}
                    />
                )}
            </div>

            {attachments.map((attach) => (
                <div key={attach.id}>
                    <Handle
                        id={attach.id}
                        type="source"
                        position={Position.Bottom}
                        style={{
                            transform: 'translate(-50%) rotate(45deg)',
                            transformOrigin: 'center',
                        }}
                        className="!bg-base-7 hover:!border-accent !border-card !size-4 !rounded-[2px] !border-2 transition-all"
                    />
                    <div className="absolute left-1/2 w-full -translate-x-1/2 text-center">
                        <span
                            className={cn(
                                'text-[10px]',
                                attach.required ? 'text-foreground' : 'text-muted-foreground/60',
                            )}
                        >
                            {t(`nodes.${attach.id}.name`)}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
