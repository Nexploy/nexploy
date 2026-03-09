'use client';

import '@xyflow/react/dist/style.css';

import { NodeAddPanel } from '@/components/pipeline/nodes/add/NodeAddPanel';
import { NodeTemplatePanel } from '@/components/pipeline/nodes/template/NodeTemplatePanel';
import { PipelineCanvas } from '@/components/pipeline/PipelineCanvas';
import { PipelineToolbar } from '@/components/pipeline/PipelineToolbar';
import { NodeConfigDialog } from '@/components/pipeline/nodes/nodeConfigPanel/NodeConfigDialog';

export function PipelineEditor() {
    return (
        <div className="flex h-full flex-col">
            <PipelineToolbar />
            <div className="mx-5 mb-5 flex flex-1 overflow-hidden rounded-md rounded-t-none border">
                <PipelineCanvas />
                <NodeTemplatePanel />
                <NodeAddPanel />
            </div>
            <NodeConfigDialog />
        </div>
    );
}
