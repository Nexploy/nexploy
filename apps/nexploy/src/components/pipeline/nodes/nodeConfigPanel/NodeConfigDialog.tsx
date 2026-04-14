'use client';

import { useRef } from 'react';
import { type Node } from '@xyflow/react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Separator } from '@workspace/ui/components/separator';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { useTranslations } from 'next-intl';
import { type NodeData, type NodeId } from '@workspace/typescript-interface/pipeline/node';
import { NodeConfigForm } from './NodeConfigForm';
import { NodeLogsPanel } from './NodeLogsPanel';
import { AvailableInputsPanel } from '@/components/pipeline/nodes/nodeConfigPanel/AvailableInputsPanel';
import { RefValidationProvider } from '@/contexts/RefValidationContext';
import { cn } from '@workspace/ui/lib/utils';

export function NodeConfigDialog() {
    const tPipeline = useTranslations('repository.pipeline');
    const tConfig = useTranslations('repository.pipeline.config');
    const tCommon = useTranslations('common');

    const { nodes, displayNodes, handleResetPanelNode, isViewingBuild, nodeStatuses } =
        usePipelineContext();
    const panelNodeId = usePipelineEditorStore((s) => s.panelNodeId);
    const activeBuildId = usePipelineEditorStore((s) => s.activeBuildId);

    const sourceNodes = isViewingBuild ? displayNodes : nodes;
    const panelNode = panelNodeId ? (sourceNodes.find((n) => n.id === panelNodeId) ?? null) : null;
    const lastNodeRef = useRef<Node | null>(null);
    if (panelNode) lastNodeRef.current = panelNode;

    const isOpen = !!panelNode;
    const node = lastNodeRef.current;
    const nodeType = node?.data.nodeType as NodeId;

    const data = node?.data as unknown as NodeData;
    const nodeDesc = data?.definition?.metadata.description;

    const isViewing = isViewingBuild || !!activeBuildId;

    return (
        <Dialog open={isOpen} onOpenChange={handleResetPanelNode}>
            <DialogContent
                aria-describedby={undefined}
                className={cn(
                    'flex !h-[80%] !max-w-[60%] flex-col gap-0 !p-0',
                    isViewing && '!max-w-[80%]',
                )}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                {node && nodeType && (
                    <>
                        <DialogHeader className={'border-b p-4'}>
                            <DialogTitle
                                className={cn(
                                    'flex flex-col gap-2 text-sm leading-none',
                                    isViewing && 'flex-row',
                                )}
                            >
                                {tPipeline(`nodes.${nodeType}.name`)}
                                {isViewing ? (
                                    <span className="text-muted-foreground text-xs font-normal">
                                        ({tConfig('viewOnly')})
                                    </span>
                                ) : (
                                    nodeDesc && (
                                        <span
                                            className={'text-muted-foreground text-xs leading-none'}
                                        >
                                            {tPipeline(`nodes.${nodeType}.description`)}
                                        </span>
                                    )
                                )}
                            </DialogTitle>
                        </DialogHeader>

                        <RefValidationProvider nodeId={node.id}>
                            {isViewing ? (
                                <>
                                    <div className="flex min-h-0 flex-1">
                                        <div className="flex w-80 flex-col">
                                            <NodeConfigForm node={node} />
                                        </div>
                                        <Separator orientation="vertical" />
                                        <NodeLogsPanel
                                            buildId={activeBuildId!}
                                            nodeId={node.id}
                                            nodeStatus={nodeStatuses[node.id]}
                                        />
                                    </div>
                                    <DialogFooter className="bg-muted/40 border-t p-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleResetPanelNode}
                                        >
                                            {tCommon('close')}
                                        </Button>
                                    </DialogFooter>
                                </>
                            ) : (
                                <div className="flex flex-1 overflow-hidden">
                                    <AvailableInputsPanel nodeId={node.id} />
                                    <Separator orientation="vertical" />
                                    <NodeConfigForm node={node} />
                                </div>
                            )}
                        </RefValidationProvider>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
