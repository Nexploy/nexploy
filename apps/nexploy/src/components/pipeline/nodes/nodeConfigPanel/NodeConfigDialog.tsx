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
    const nodeType = node?.data.nodeType as NodeId | undefined;

    if (!isViewingBuild || !activeBuildId) {
        return (
            <Dialog open={isOpen} onOpenChange={handleResetPanelNode}>
                <DialogContent
                    aria-describedby={undefined}
                    className="overflow-hidden"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    {node && <NodeConfigForm node={node} />}
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleResetPanelNode}>
            <DialogContent
                aria-describedby={undefined}
                className="flex !h-[80%] !max-w-[80%] flex-col gap-0 !p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                {node && nodeType && (
                    <>
                        <DialogHeader className={'border-b p-4'}>
                            <DialogTitle className="flex items-center gap-2 text-sm">
                                {tPipeline(`nodes.${nodeType}.name`)}
                                <span className="text-muted-foreground text-xs font-normal">
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
                                nodeStatus={nodeStatuses[node.id]}
                            />
                        </div>

                        <DialogFooter className="bg-muted/40 border-t px-4 py-4">
                            <Button variant="outline" size="sm" onClick={handleResetPanelNode}>
                                {tCommon('close')}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
