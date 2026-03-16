import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { PipelineEditor } from '@/components/pipeline/PipelineEditor';
import { PipelineProvider } from '@/contexts/PipelineContext';
import { ReactFlowProvider } from '@xyflow/react';
import { Build } from 'generated/client';

interface PipelineEditorPageProps {
    initialGraph: PipelineGraph;
    builds: Build[];
}

export function PipelineEditorPage({ initialGraph, builds }: PipelineEditorPageProps) {
    return (
        <ReactFlowProvider>
            <PipelineProvider initialGraph={initialGraph} builds={builds}>
                <PipelineEditor />
            </PipelineProvider>
        </ReactFlowProvider>
    );
}
