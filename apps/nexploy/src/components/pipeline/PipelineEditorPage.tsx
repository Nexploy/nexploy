'use client';

import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { PipelineEditor } from '@/components/pipeline/PipelineEditor';
import { PipelineProvider } from '@/contexts/PipelineContext';
import { ReactFlowProvider } from '@xyflow/react';

interface PipelineEditorPageProps {
    initialGraph: PipelineGraph;
}

export function PipelineEditorPage({ initialGraph }: PipelineEditorPageProps) {
    return (
        <ReactFlowProvider>
            <PipelineProvider initialGraph={initialGraph}>
                <PipelineEditor />
            </PipelineProvider>
        </ReactFlowProvider>
    );
}
