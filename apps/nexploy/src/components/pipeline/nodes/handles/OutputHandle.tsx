import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { Handle, Position, useConnection, useNodeConnections } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';
import React from 'react';

interface OutputHandleProps {
    handle: NodeDefinition['handles']['outputs'][number];
    nodeId: string;
    handleColor: string;
}

export function OutputHandle({ handle, nodeId, handleColor }: OutputHandleProps) {
    const connection = useConnection();
    const connections = useNodeConnections({ handleType: 'source' });

    const isSourceConnecting = connection.inProgress && connection.fromNode?.id === nodeId;
    const active = connections.length > 0 || isSourceConnecting;

    const pos = handle.position;
    const offsetClass =
        pos === Position.Top
            ? '!-top-[3px]'
            : pos === Position.Bottom
              ? '!-bottom-[3px]'
              : pos === Position.Left
                ? '!-left-[3px]'
                : '!-right-[3px]';

    return (
        <Handle
            id={handle.id}
            type="source"
            position={pos}
            className={cn(
                '!bg-base-7 !border-card !size-4.5 !rounded-full !border-2 transition-all hover:!size-6',
                offsetClass,
                active && handleColor,
            )}
        />
    );
}
