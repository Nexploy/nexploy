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
import { type NodeId } from '@workspace/typescript-interface/pipeline/node';
import { NodeConfigForm } from './NodeConfigForm';
import { NodeLogsPanel } from './NodeLogsPanel';
import { NodeRunStatus } from '@/types/pipeline.type';

export function NodeConfigDialog() {
    const tPipeline = useTranslations('repository.pipeline');
    const tConfig = useTranslations('repository.pipeline.config');
    const tCommon = useTranslations('common');
    const { nodes, handleResetPanelNode, isViewingBuild, activeBuildId, nodeStatuses } =
        usePipelineContext();
    const panelNodeId = usePipelineEditorStore((s) => s.panelNodeId);

    const panelNode = panelNodeId ? (nodes.find((n) => n.id === panelNodeId) ?? null) : null;
    const lastNodeRef = useRef<Node | null>(null);
    if (panelNode) lastNodeRef.current = panelNode;

    const isOpen = !!panelNode;
    const node = lastNodeRef.current;
    const nodeType = node?.data.nodeType as NodeId | undefined;

    if (!isViewingBuild || !activeBuildId) {
        return (
            <Dialog open={isOpen} onOpenChange={handleResetPanelNode}>
                <DialogContent className="overflow-hidden">
                    {node && <NodeConfigForm node={node} />}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleResetPanelNode}>
            <DialogContent className="flex !h-[80%] !max-w-[80%] flex-col gap-0 !p-0">
                {node && nodeType && (
                    <>
                        <DialogHeader className={'border-b py-4'}>
                            <DialogTitle className="text-sm">
                                {tPipeline(`nodes.${nodeType}.name`)}
                                <span className="text-muted-foreground ml-2 text-xs font-normal">
                                    ({tConfig('viewOnly')})
                                </span>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="flex min-h-0 flex-1">
                            <div className="flex w-80 shrink-0 flex-col py-4">
                                <NodeConfigForm node={node} />
                            </div>
                            <Separator orientation="vertical" />
                            <NodeLogsPanel
                                buildId={activeBuildId}
                                nodeId={node.id}
                                nodeStatus={nodeStatuses[node.id] as NodeRunStatus | undefined}
                            />
                        </div>

                        <DialogFooter className="bg-muted/40 border-t px-6 py-4">
                            <Button variant="outline" size="sm" onClick={handleResetPanelNode}>
                                {tCommon('cancel')}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
