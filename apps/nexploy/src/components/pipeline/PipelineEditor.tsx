'use client';

import { PipelineCanvas } from '@/components/pipeline/PipelineCanvas';
import { PipelineToolbar } from '@/components/pipeline/PipelineToolbar';
import { NodeConfigDialog } from '@/components/pipeline/nodes/nodeConfigPanel/NodeConfigDialog';
import { PipelineSidePanel } from '@/components/pipeline/PipelineSidePanel.tsx';

export function PipelineEditor() {
    return (
        <div className="flex h-full flex-col">
            <PipelineToolbar />
            <div className="mx-5 mb-5 flex min-h-0 flex-1 rounded-b-lg border">
                <PipelineCanvas />
                <PipelineSidePanel />
            </div>
            <NodeConfigDialog />
        </div>
    );
}
