import { PipelineGraph } from '@workspace/typescript-interface/pipeline/node';
import { PipelineEditor } from '@/components/pipeline/PipelineEditor';
import { PipelineProvider } from '@/contexts/PipelineContext';
import { ReactFlowProvider } from '@xyflow/react';
import { Build } from 'generated/client';

interface PipelineEditorPageProps {
    initialGraph: PipelineGraph;
    initialBuilds: Build[];
    initialHasMore: boolean;
}

export function PipelineEditorPage({
    initialGraph,
    initialBuilds,
    initialHasMore,
}: PipelineEditorPageProps) {
    return (
        <ReactFlowProvider>
            <PipelineProvider
                initialGraph={initialGraph}
                initialBuilds={initialBuilds}
                initialHasMore={initialHasMore}
            >
                <PipelineEditor />
            </PipelineProvider>
        </ReactFlowProvider>
    );
}
