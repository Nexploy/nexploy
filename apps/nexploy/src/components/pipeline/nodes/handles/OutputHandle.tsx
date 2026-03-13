import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { Handle, Position, useConnection, useNodeConnections } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';
import React from 'react';

interface OutputHandleProps {
    handle: NodeDefinition['handles']['outputs'][number];
    nodeId: string;
    handleColor: string;
    position: Position;
}

export function OutputHandle({ handle, nodeId, handleColor, position }: OutputHandleProps) {
    const connection = useConnection();
    const connections = useNodeConnections({ handleType: 'source', handleId: handle.id });

    const isSourceConnecting =
        connection.inProgress &&
        connection.fromNode?.id === nodeId &&
        connection.fromHandle?.id === handle.id;
    const active = connections.length > 0 || isSourceConnecting;

    const offsetClass =
        position === Position.Top
            ? '!-top-[3px]'
            : position === Position.Bottom
              ? '!-bottom-[3px]'
              : position === Position.Left
                ? '!-left-[3px]'
                : '!-right-[3px]';

    return (
        <Handle
            id={handle.id}
            type="source"
            position={position}
            className={cn(
                '!bg-base-7 !border-card !size-4.5 !rounded-full !border-2 transition-all hover:!size-6',
                offsetClass,
                active && handleColor,
            )}
        />
    );
}
