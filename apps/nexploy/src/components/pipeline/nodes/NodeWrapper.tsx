'use client';

import React from 'react';
import { Power, Settings, Trash2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import { type NodeRunStatus } from '@/types/pipeline.type';
import { Position, useReactFlow } from '@xyflow/react';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { NodeType } from '@workspace/typescript-interface/pipeline/node';
import { CATEGORY_BG } from '@/components/pipeline/pipelineTheme';
import { InputHandle } from '@/components/pipeline/nodes/handles/InputHandle';
import { OutputHandle } from '@/components/pipeline/nodes/handles/OutputHandle';
import { AttachmentHandle } from '@/components/pipeline/nodes/handles/AttachmentHandle';

const NODE_HANDLE_POSITIONS: Record<
    NodeType,
    { inputs: Position; outputs: Position; attachments: Position }
> = {
    'base-node': { inputs: Position.Left, outputs: Position.Right, attachments: Position.Bottom },
    'large-node': { inputs: Position.Left, outputs: Position.Right, attachments: Position.Bottom },
    'attach-node': { inputs: Position.Top, outputs: Position.Right, attachments: Position.Bottom },
};

interface NodeWrapperProps {
    id: string;
    data: {
        definition: NodeDefinition;
        nodeType: string;
        disabled?: boolean;
        viewOnly?: boolean;
        runStatus?: NodeRunStatus;
    };
    className?: string;
    children: React.ReactNode;
}

export function NodeWrapper({ id, data, className, children }: NodeWrapperProps) {
    const nodeType = (data.definition.type ?? 'base-node') as NodeType;
    const positions = NODE_HANDLE_POSITIONS[nodeType];
    const handleColor = CATEGORY_BG[data.definition.category]!;

    const { deleteElements, getNodes } = useReactFlow();
    const { triggerAutoSave, setNodes, openDialogSettingNode } = usePipelineContext();

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
                    ? { ...node, data: { ...node.data, disabled: !data.disabled } }
                    : node,
            ),
        );
        triggerAutoSave();
    };

    return (
        <div
            className={cn(
                'group relative',
                (data.disabled || data.runStatus === 'skipped') && 'opacity-40',
                className,
            )}
        >
            {!data.viewOnly && (
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
                            data.disabled
                                ? 'text-muted-foreground hover:text-foreground'
                                : 'text-foreground hover:text-muted-foreground',
                        )}
                    >
                        <Power className="size-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => openDialogSettingNode(id)}
                        className={cn(
                            'size-6',
                            data.disabled
                                ? 'text-muted-foreground hover:text-foreground'
                                : 'text-foreground hover:text-muted-foreground',
                        )}
                    >
                        <Settings className="size-3" />
                    </Button>
                    <Button onClick={handleDelete} variant="destructiveGhost" className="size-6">
                        <Trash2 className="size-3" />
                    </Button>
                </div>
            )}

            {children}

            {data.definition.handles.inputs.map((handle) => (
                <InputHandle
                    key={handle.id}
                    handle={handle}
                    nodeId={id}
                    handleColor={handleColor}
                    position={positions.inputs}
                />
            ))}
            {data.definition.handles.outputs.map((handle) => (
                <OutputHandle
                    key={handle.id}
                    handle={handle}
                    nodeId={id}
                    handleColor={handleColor}
                    position={positions.outputs}
                />
            ))}
            {(data.definition.handles.attachments ?? []).map((attach) => (
                <AttachmentHandle
                    key={attach.id}
                    attach={attach}
                    handleColor={handleColor}
                    position={positions.attachments}
                />
            ))}
        </div>
    );
}
