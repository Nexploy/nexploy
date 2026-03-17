'use client';

import React from 'react';
import { Power, Settings, Trash2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import { useReactFlow } from '@xyflow/react';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { type NodeData } from '@workspace/typescript-interface/pipeline/node';
import { CATEGORY_BG } from '@/components/pipeline/pipelineTheme';
import { InputHandle } from '@/components/pipeline/nodes/handles/InputHandle';
import { OutputHandle } from '@/components/pipeline/nodes/handles/OutputHandle';
import { AttachmentHandle } from '@/components/pipeline/nodes/handles/AttachmentHandle';

interface NodeWrapperProps {
    id: string;
    data: NodeData;
    className?: string;
    children: React.ReactNode;
}

export function NodeWrapper({ id, data, className, children }: NodeWrapperProps) {
    const handleColor = CATEGORY_BG[data.definition.category]!;
    const isAttachNode = data.definition.type === 'attach-node';

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
                (data.disabled || data.status === 'skipped') && 'opacity-40',
                className,
            )}
        >
            {data.viewOnly ? (
                <div
                    onDoubleClick={(e) => e.stopPropagation()}
                    className={cn(
                        'bg-background absolute -top-9 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1',
                        'scale-75 opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100',
                    )}
                >
                    <Button
                        variant="ghost"
                        onClick={() => openDialogSettingNode(id)}
                        className="text-muted-foreground hover:text-foreground size-6"
                    >
                        <Settings className="size-3" />
                    </Button>
                </div>
            ) : (
                <div
                    onDoubleClick={(e) => e.stopPropagation()}
                    className={cn(
                        'bg-background absolute -top-9 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1',
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
                    position={handle.position}
                    square={isAttachNode}
                />
            ))}
            {data.definition.handles.outputs.map((handle) => (
                <OutputHandle
                    key={handle.id}
                    handle={handle}
                    nodeId={id}
                    handleColor={handleColor}
                    position={handle.position}
                />
            ))}
            {data.definition.handles.attachments.map((attach) => (
                <AttachmentHandle
                    key={attach.id}
                    attach={attach}
                    handleColor={handleColor}
                    position={attach.position}
                />
            ))}
        </div>
    );
}
