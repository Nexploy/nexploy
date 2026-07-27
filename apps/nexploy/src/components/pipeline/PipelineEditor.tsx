'use client';

import { PipelineCanvas } from '@/components/pipeline/PipelineCanvas';
import { PipelineToolbar } from '@/components/pipeline/PipelineToolbar';
import { NodeConfigDialog } from '@/components/pipeline/nodes/nodeConfigPanel/NodeConfigDialog';

export function PipelineEditor() {
    return (
        <div className="flex h-full flex-col">
            <PipelineToolbar />
            <div className="relative mx-5 mb-5 flex flex-1 overflow-hidden rounded-lg rounded-t-none border">
                <PipelineCanvas />
            </div>
            <NodeConfigDialog />
        </div>
    );
}
