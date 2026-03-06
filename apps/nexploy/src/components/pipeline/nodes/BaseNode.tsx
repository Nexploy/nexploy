'use client';

import { Handle, Position, useConnection, useNodeConnections, useReactFlow } from '@xyflow/react';
import { NodeDefinition } from '@workspace/typescript-interface/pipeline/nodeDefinition';
import { useTranslations } from 'next-intl';
import { Terminal, Trash2 } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/components/button';
import {
    CATEGORY_BG,
    CATEGORY_BORDER,
    CATEGORY_GLOW,
    ICON_NAME_MAP,
} from '@/components/pipeline/pipelineTheme';

interface BaseNodeProps {
    id: string;
    data: {
        label: string;
        nodeType: string;
        definition: NodeDefinition;
        config: Record<string, unknown>;
        pipelineNodeType: string;
    };
    selected?: boolean;
}

export function BaseNode({ id, data, selected }: BaseNodeProps) {
    const { definition } = data;
    const t = useTranslations('repository.pipeline');
    const Icon = ICON_NAME_MAP[definition.metadata.icon] ?? Terminal;
    const hasInputs = definition.handles.inputs.length > 0;
    const hasOutputs = definition.handles.outputs.length > 0;
    const { deleteElements } = useReactFlow();

    const connection = useConnection();
    const inputConnections = useNodeConnections({ handleType: 'target' });
    const outputConnections = useNodeConnections({ handleType: 'source' });
    const handleColor = CATEGORY_BG[definition.category];

    const isSourceConnecting = connection.inProgress && connection.fromNode?.id === id;
    const isTargetHighlighted =
        connection.inProgress && connection.toNode?.id === id && connection.isValid;

    const inputActive = inputConnections.length > 0 || isTargetHighlighted;
    const outputActive = outputConnections.length > 0 || isSourceConnecting;

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <div className="group relative flex flex-col items-center">
            <Button
                onClick={handleDelete}
                variant="destructiveGhost"
                className={cn(
                    'absolute -top-7 left-1/2 flex size-6 -translate-x-1/2 transition-all duration-150',
                    'scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 hover:scale-100',
                )}
            >
                <Trash2 className="size-3" />
            </Button>

            <div
                className={cn(
                    'bg-card relative flex size-20 items-center justify-center rounded-2xl border-2 shadow-lg transition-all duration-150',
                    selected
                        ? cn(
                              'border-2 shadow-xl',
                              CATEGORY_BORDER[definition.category],
                              CATEGORY_GLOW[definition.category],
                          )
                        : 'border-border hover:border-accent',
                )}
            >
                {hasInputs && (
                    <Handle
                        type="target"
                        position={Position.Left}
                        className={cn(
                            '!bg-base-7 !border-card !-left-[3px] !size-4.5 !rounded-full !border-2 transition-all hover:!size-6',
                            inputActive && `!${handleColor}`,
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

                {hasOutputs && (
                    <Handle
                        type="source"
                        position={Position.Right}
                        className={cn(
                            '!bg-base-7 !border-card !-right-[3px] !size-4.5 !rounded-full !border-2 transition-all hover:!size-6',
                            outputActive && `!${handleColor}`,
                        )}
                    />
                )}
            </div>

            <span
                className={cn(
                    'mt-2 max-w-[120px] text-center text-xs font-medium transition-colors',
                    selected ? 'text-foreground' : 'text-muted-foreground',
                )}
            >
                {t(`nodes.${data.nodeType}.name`)}
            </span>
        </div>
    );
}
