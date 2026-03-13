import React, { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { Handle, useConnection, useNodeConnections } from '@xyflow/react';
import { cn } from '@workspace/ui/lib/utils';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';

interface AttachmentHandleProps {
    attach: NonNullable<NodeDefinition['handles']['attachments']>[number];
    handleColor: string;
}

export function AttachmentHandle({ attach, handleColor }: AttachmentHandleProps) {
    const t = useTranslations('repository.pipeline');
    const connection = useConnection();
    const connections = useNodeConnections({ handleType: 'source', handleId: attach.id });

    const isSourceConnecting = connection.inProgress && connection.fromHandle?.id === attach.id;
    const active = connections.length > 0 || isSourceConnecting;

    return (
        <>
            <Handle
                id={attach.id}
                type="source"
                position={attach.position}
                className={cn(
                    '!bg-base-7 !border-card !size-4.5 -translate-x-16 !rounded-[2px] !border-2 transition-all hover:!size-6',
                    active && handleColor,
                )}
            />
            <span
                className={cn(
                    'absolute -bottom-6 -left-4 text-center text-[10px]',
                    attach.required ? 'text-foreground' : 'text-muted-foreground/60',
                )}
            >
                {t(`nodes.${attach.id}.name`)}
            </span>
        </>
    );
}
