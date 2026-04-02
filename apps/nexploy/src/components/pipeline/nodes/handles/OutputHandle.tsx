import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { Handle, Position, useConnection, useNodeConnections } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';

interface OutputHandleProps {
    handle: NodeDefinition['handles']['outputs'][number];
    nodeId: string;
    handleColor: string;
    position: Position;
    index: number;
    total: number;
}

export function OutputHandle({
    handle,
    nodeId,
    handleColor,
    position,
    index,
    total,
}: OutputHandleProps) {
    const connection = useConnection();
    const connections = useNodeConnections({ handleType: 'source', handleId: handle.id });

    const isSourceConnecting =
        connection.inProgress &&
        connection.fromNode?.id === nodeId &&
        connection.fromHandle?.id === handle.id;
    const isTargetHovered =
        connection.inProgress &&
        connection.toNode?.id === nodeId &&
        (!connection.toHandle?.id || connection.toHandle.id === handle.id);
    const active = connections.length > 0 || isSourceConnecting || isTargetHovered;

    const offsetClass =
        position === Position.Top
            ? '!-top-[3px]'
            : position === Position.Bottom
              ? '!-bottom-[3px]'
              : position === Position.Left
                ? '!-left-[3px]'
                : '!-right-[3px]';

    const offset = total > 1 ? `${((index + 1) / (total + 1)) * 100}%` : undefined;
    const positionStyle =
        offset === undefined
            ? undefined
            : position === Position.Left || position === Position.Right
              ? { top: offset }
              : { left: offset };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Handle
                    id={handle.id}
                    type="source"
                    position={position}
                    style={positionStyle}
                    className={cn(
                        '!bg-base-7 !border-card !size-4.5 !rounded-full !border-2 transition-all hover:!size-6',
                        offsetClass,
                        active && handleColor,
                    )}
                >
                    {handle.label && (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[7px] font-bold">
                            {handle.label[0]!.toUpperCase()}
                        </span>
                    )}
                </Handle>
            </TooltipTrigger>
            {handle.label && (
                <TooltipContent className="flex items-center gap-1.5">
                    {handle.label}
                </TooltipContent>
            )}
        </Tooltip>
    );
}
