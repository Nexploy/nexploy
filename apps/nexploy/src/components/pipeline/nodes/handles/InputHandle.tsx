import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { Handle, Position, useConnection, useNodeConnections } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';

interface InputHandleProps {
    handle: NodeDefinition['handles']['inputs'][number];
    nodeId: string;
    handleColor: string;
    position: Position;
    square?: boolean;
}

export function InputHandle({ handle, nodeId, handleColor, position, square }: InputHandleProps) {
    const connection = useConnection();
    const connections = useNodeConnections({ handleType: 'target', handleId: handle.id });

    const isTargetConnecting =
        connection.inProgress &&
        connection.toNode?.id === nodeId &&
        (!connection.toHandle?.id || connection.toHandle.id === handle.id);
    const isDraggingFrom =
        connection.inProgress &&
        connection.fromNode?.id === nodeId &&
        connection.fromHandle?.id === handle.id;
    const active = connections.length > 0 || isTargetConnecting || isDraggingFrom;

    const offsetClass =
        position === Position.Top
            ? '!-top-[3px]'
            : position === Position.Bottom
              ? '!-bottom-[3px]'
              : position === Position.Right
                ? '!-right-[3px]'
                : '!-left-[3px]';

    return (
        <Handle
            id={handle.id}
            type="target"
            position={position}
            className={cn(
                '!bg-base-7 !border-card !size-4.5 !border-2 transition-all hover:!size-6',
                square ? '!rounded-[2px]' : '!rounded-full',
                offsetClass,
                active && handleColor,
            )}
        />
    );
}
