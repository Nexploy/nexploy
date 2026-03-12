import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { Handle, Position, useConnection, useNodeConnections } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';

interface InputHandleProps {
    handle: NodeDefinition['handles']['inputs'][number];
    nodeId: string;
    handleColor: string;
}

export function InputHandle({ handle, nodeId, handleColor }: InputHandleProps) {
    const connection = useConnection();
    const connections = useNodeConnections({ handleType: 'target' });

    const isTargetConnecting = connection.inProgress && connection.toNode?.id === nodeId;
    const active = connections.length > 0 || isTargetConnecting;

    const pos = handle.position;
    const offsetClass =
        pos === Position.Top
            ? '!-top-[3px]'
            : pos === Position.Bottom
              ? '!-bottom-[3px]'
              : pos === Position.Right
                ? '!-right-[3px]'
                : '!-left-[3px]';

    return (
        <Handle
            id={handle.id}
            type="target"
            position={pos}
            className={cn(
                '!bg-base-7 !border-card !size-4.5 !rounded-full !border-2 transition-all hover:!size-6',
                offsetClass,
                active && handleColor,
            )}
        />
    );
}
