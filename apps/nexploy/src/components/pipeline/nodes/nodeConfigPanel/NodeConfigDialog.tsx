'use client';

import { useRef } from 'react';
import { type Node } from '@xyflow/react';
import { Dialog, DialogContent } from '@workspace/ui/components/dialog';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { usePipelineEditorStore } from '@/stores/usePipelineEditorStore';
import { NodeConfigForm } from './NodeConfigForm';

export function NodeConfigDialog() {
    const { nodes, handlePaneClick } = usePipelineContext();
    const panelNodeId = usePipelineEditorStore((s) => s.panelNodeId);

    const panelNode = panelNodeId ? (nodes.find((n) => n.id === panelNodeId) ?? null) : null;
    const lastNodeRef = useRef<Node | null>(null);
    if (panelNode) lastNodeRef.current = panelNode;

    const isOpen = !!panelNode;

    return (
        <Dialog open={isOpen} onOpenChange={handlePaneClick}>
            <DialogContent className="overflow-hidden">
                {lastNodeRef.current && <NodeConfigForm node={lastNodeRef.current} />}
            </DialogContent>
        </Dialog>
    );
}
