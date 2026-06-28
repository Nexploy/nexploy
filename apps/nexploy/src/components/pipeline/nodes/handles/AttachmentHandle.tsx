import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Handle, Position, useConnection, useNodeConnections } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';

interface AttachmentHandleProps {
    attach: NonNullable<NodeDefinition['handles']['attachments']>[number];
    handleColor: string;
    position: Position;
}

export function AttachmentHandle({ attach, handleColor, position }: AttachmentHandleProps) {
    const [isHovered, setIsHovered] = useState(false);
    const t = useTranslations('repository.pipeline');
    const connection = useConnection();
    const connections = useNodeConnections({ handleType: 'source', handleId: attach.id });

    const isSourceConnecting = connection.inProgress && connection.fromHandle?.id === attach.id;
    const active =
        connections.length > 0 || isSourceConnecting || (connection.inProgress && isHovered);

    return (
        <div className={'relative'}>
            <Handle
                id={attach.id}
                type="source"
                position={position}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    'bg-base-7! border-card! size-4.5! -translate-x-16 rounded-[2px]! border-2! transition-all hover:size-6!',
                    active && handleColor,
                )}
            />
            {connections.length === 0 && (
                <span
                    className={cn(
                        'absolute -bottom-6 left-[calc(50%-4rem)] -translate-x-1/2 text-center text-[10px] whitespace-nowrap',
                        'text-muted-foreground/60',
                    )}
                >
                    {t(`nodes.${attach.id}.name`)}
                </span>
            )}
        </div>
    );
}
