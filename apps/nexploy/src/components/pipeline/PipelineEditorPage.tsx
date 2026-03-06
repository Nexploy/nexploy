'use client';

import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { PipelineEditor } from '@/components/pipeline/PipelineEditor';
import { PipelineProvider } from '@/contexts/PipelineContext';
import { ReactFlowProvider } from '@xyflow/react';

interface PipelineEditorPageProps {
    repositoryId: string;
    initialGraph: PipelineGraph;
}

export function PipelineEditorPage({ repositoryId, initialGraph }: PipelineEditorPageProps) {
    return (
        <ReactFlowProvider>
            <PipelineProvider initialGraph={initialGraph}>
                <PipelineEditor repositoryId={repositoryId} />
            </PipelineProvider>
        </ReactFlowProvider>
    );
}
