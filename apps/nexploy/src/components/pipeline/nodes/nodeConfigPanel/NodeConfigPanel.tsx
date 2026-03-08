'use client';

import { type Node } from '@xyflow/react';
import { Dialog, DialogContent } from '@workspace/ui/components/dialog';
import { usePipelineContext } from '@/contexts/PipelineContext';
import { NodeConfigForm } from './NodeConfigForm';

interface NodeConfigPanelProps {
    node: Node;
    isOpen: boolean;
}

export function NodeConfigPanel({ node, isOpen }: NodeConfigPanelProps) {
    const { handlePaneClick } = usePipelineContext();

    return (
        <Dialog open={isOpen} onOpenChange={handlePaneClick}>
            <DialogContent className="overflow-hidden">
                {isOpen && <NodeConfigForm node={node} onClose={handlePaneClick} />}
            </DialogContent>
        </Dialog>
    );
}
